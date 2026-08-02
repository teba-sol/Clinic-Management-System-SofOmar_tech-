import { pgTable, uuid, varchar, date, text, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const bookingRequestStatusEnum = pgEnum('booking_request_status', [
  'pending', 'contacted', 'converted', 'declined',
]);

export const preferredTimeEnum = pgEnum('preferred_time', ['morning', 'afternoon', 'evening']);

export const bookingRequests = pgTable('booking_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  department: varchar('department', { length: 100 }).notNull(),
  preferredDate: date('preferred_date').notNull(),
  preferredTime: preferredTimeEnum('preferred_time').notNull(),
  doctorId: uuid('doctor_id').references(() => users.id, { onDelete: 'set null' }),
  reason: text('reason'),
  status: bookingRequestStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
