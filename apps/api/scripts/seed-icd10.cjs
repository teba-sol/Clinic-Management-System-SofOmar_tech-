/* eslint-disable no-console */
/**
 * Seed the diagnosis_codes table with the full public-domain ICD-10-CM dataset.
 *
 * Data source: @lowlysre/icd-10-cm (data/icd10.min.json) — US public domain (NCHS/CMS).
 * Usage: npm run seed:icd10
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATA_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  '@lowlysre',
  'icd-10-cm',
  'data',
  'icd10.min.json',
);

const CHAPTERS = [
  { label: 'Infectious & Parasitic Diseases', test: (c) => c >= 'A00' && c <= 'B99' },
  { label: 'Neoplasms', test: (c) => c >= 'C00' && c <= 'D49' },
  { label: 'Blood & Immune Disorders', test: (c) => c >= 'D50' && c <= 'D89' },
  { label: 'Endocrine, Nutritional & Metabolic', test: (c) => c >= 'E00' && c <= 'E89' },
  { label: 'Mental, Behavioral & Neurodevelopmental', test: (c) => c >= 'F01' && c <= 'F99' },
  { label: 'Nervous System', test: (c) => c >= 'G00' && c <= 'G99' },
  { label: 'Eye & Adnexa', test: (c) => c >= 'H00' && c <= 'H59' },
  { label: 'Ear & Mastoid Process', test: (c) => c >= 'H60' && c <= 'H95' },
  { label: 'Circulatory System', test: (c) => c >= 'I00' && c <= 'I99' },
  { label: 'Respiratory System', test: (c) => c >= 'J00' && c <= 'J99' },
  { label: 'Digestive System', test: (c) => c >= 'K00' && c <= 'K95' },
  { label: 'Skin & Subcutaneous Tissue', test: (c) => c >= 'L00' && c <= 'L99' },
  { label: 'Musculoskeletal & Connective Tissue', test: (c) => c >= 'M00' && c <= 'M99' },
  { label: 'Genitourinary System', test: (c) => c >= 'N00' && c <= 'N99' },
  { label: 'Pregnancy, Childbirth & Puerperium', test: (c) => c >= 'O00' && c <= 'O9A' },
  { label: 'Perinatal Period', test: (c) => c >= 'P00' && c <= 'P96' },
  { label: 'Congenital Malformations', test: (c) => (c >= 'Q00' && c <= 'Q99') || (c >= 'QA0' && c <= 'QA9') },
  { label: 'Symptoms, Signs & Abnormal Findings', test: (c) => c >= 'R00' && c <= 'R99' },
  { label: 'Injury, Poisoning & External Causes', test: (c) => c >= 'S00' && c <= 'T88' },
  { label: 'Codes for Special Purposes', test: (c) => c >= 'U00' && c <= 'U85' },
  { label: 'External Causes of Morbidity', test: (c) => c >= 'V00' && c <= 'Y99' },
  { label: 'Factors Influencing Health Status', test: (c) => c >= 'Z00' && c <= 'Z99' },
];

function formatCode(key) {
  return key.length > 3 ? `${key.slice(0, 3)}.${key.slice(3)}` : key;
}

function chapterFor(code) {
  const prefix = code.slice(0, 3);
  const match = CHAPTERS.find((ch) => ch.test(prefix));
  return match ? match.label : null;
}

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const raw = fs.readFileSync(envPath, 'utf8');
  const m = raw.match(/^DATABASE_URL="?([^"\r\n]+)"?/m);
  if (!m) throw new Error('DATABASE_URL not found in .env');
  return m[1];
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const entries = Object.entries(data);
  console.log(`Loaded ${entries.length} ICD-10-CM codes from ${path.basename(DATA_PATH)}`);

  const pool = new Pool({ connectionString: loadEnv() });
  const client = await pool.connect();
  const BATCH = 1000;
  let inserted = 0;

  try {
    await client.query('BEGIN');
    for (let i = 0; i < entries.length; i += BATCH) {
      const chunk = entries.slice(i, i + BATCH);
      const values = [];
      for (const [key, description] of chunk) {
        values.push([formatCode(key), description, chapterFor(key), true]);
      }

      const placeholders = values
        .map(
          (_, j) =>
            `($${j * 4 + 1}, $${j * 4 + 2}, $${j * 4 + 3}, $${j * 4 + 4})`,
        )
        .join(',');
      const params = values.flat();

      await client.query(
        `INSERT INTO diagnosis_codes (code, description, category, active)
         VALUES ${placeholders}
         ON CONFLICT (code) DO UPDATE SET
           description = EXCLUDED.description,
           category = COALESCE(diagnosis_codes.category, EXCLUDED.category),
           active = true,
           updated_at = now()`,
        params,
      );
      inserted += values.length;
    }
    await client.query('COMMIT');
    console.log(`Upserted ${inserted} rows into diagnosis_codes`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
