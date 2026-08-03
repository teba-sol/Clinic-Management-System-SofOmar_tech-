import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const MAGIC = Buffer.from('ENCV1');
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function keyBytes(): Buffer | null {
  const key = process.env.PHI_ENC_KEY;
  if (!key) return null;
  return createHash('sha256').update(key).digest();
}

export function isPhiEncryptionEnabled(): boolean {
  return keyBytes() !== null;
}

export function encryptFile(data: Buffer): Buffer {
  const key = keyBytes();
  if (!key) return data;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, iv, tag, encrypted]);
}

export function decryptFile(data: Buffer): Buffer {
  const key = keyBytes();
  if (!key) return data;
  if (!data.subarray(0, MAGIC.length).equals(MAGIC)) return data;

  const iv = data.subarray(MAGIC.length, MAGIC.length + IV_LENGTH);
  const tag = data.subarray(
    MAGIC.length + IV_LENGTH,
    MAGIC.length + IV_LENGTH + TAG_LENGTH,
  );
  const encrypted = data.subarray(MAGIC.length + IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
