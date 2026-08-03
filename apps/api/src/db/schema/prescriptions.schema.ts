import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { visits } from './visits.schema';
import { patients } from './patients.schema';
import { users } from './users.schema';

export const prescriptionStatusEnum = pgEnum('prescription_status', [
  'pending', 'dispensed', 'cancelled',
]);

export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Array of { drugName, dosage, frequency, route, duration }
  items: jsonb('items').notNull(),

  pdfUrl: text('pdf_url'),
  status: prescriptionStatusEnum('status').notNull().default('pending'),
  dispensedByUserId: uuid('dispensed_by_user_id').references(() => users.id),
  dispensedAt: timestamp('dispensed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
