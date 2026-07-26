import { pgTable, uuid, integer, time, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const dayOfWeekEnum = pgEnum('day_of_week', [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]);

export const doctorSchedules = pgTable('doctor_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(20),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
