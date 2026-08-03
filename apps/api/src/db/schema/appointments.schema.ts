import { pgTable, uuid, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { patients } from './patients.schema';

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'booked', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'triaged',
]);

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  queueNumber: integer('queue_number').notNull(),
  status: appointmentStatusEnum('status').notNull().default('booked'),
  returnedForRecheck: boolean('returned_for_recheck').notNull().default(false),
  checkedInAt: timestamp('checked_in_at'),
  startedAt: timestamp('started_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
