import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { visits } from './visits.schema';
import { patients } from './patients.schema';
import { users } from './users.schema';

export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitId: uuid('visit_id').notNull().references(() => visits.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Array of { drugName, dosage, frequency, route, duration }
  items: jsonb('items').notNull(),

  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
