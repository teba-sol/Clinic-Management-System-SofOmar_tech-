import { pgTable, uuid, text, timestamp, numeric } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { patients } from './patients.schema';
import { appointments } from './appointments.schema';

export const vitals = pgTable('vitals', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointments.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  recordedByNurseId: uuid('recorded_by_nurse_id').notNull().references(() => users.id),
  bloodPressure: text('blood_pressure'),
  temperature: text('temperature'),
  pulse: text('pulse'),
  weight: text('weight'),
  height: text('height'),
  bmi: numeric('bmi'),
  chiefComplaint: text('chief_complaint'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
