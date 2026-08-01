import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { patients } from './patients.schema';
import { users } from './users.schema';
import { appointments } from './appointments.schema';

export const visits = pgTable('visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // SOAP notes
  subjective: text('subjective'),
  objective: text('objective'),
  assessment: text('assessment'),
  plan: text('plan'),

  diagnosisCode: text('diagnosis_code'),
  diagnosisDescription: text('diagnosis_description'),

  addendum: text('addendum'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
