import { pgTable, uuid, timestamp, integer, boolean, text, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { patients } from './patients.schema';

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'booked', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'triaged',
]);

export const appointmentPriorityEnum = pgEnum('appointment_priority', [
  'routine', 'urgent', 'emergency',
]);

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  queueNumber: integer('queue_number').notNull(),
  status: appointmentStatusEnum('status').notNull().default('booked'),
  priority: appointmentPriorityEnum('priority').notNull().default('routine'),
  priorityReason: text('priority_reason'),
  priorityChangedBy: uuid('priority_changed_by').references(() => users.id, { onDelete: 'set null' }),
  priorityChangedAt: timestamp('priority_changed_at'),
  returnedForRecheck: boolean('returned_for_recheck').notNull().default(false),
  checkedInAt: timestamp('checked_in_at'),
  startedAt: timestamp('started_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
