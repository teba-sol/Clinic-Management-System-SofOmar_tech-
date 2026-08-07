import { pgTable, integer, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const clinicSettings = pgTable('clinic_settings', {
  id: integer('id').primaryKey().default(1),
  clinicName: varchar('clinic_name', { length: 255 }).notNull().default('SofOmar Clinic'),
  tagline: varchar('tagline', { length: 255 }).notNull().default('Your trusted health partner'),
  address: varchar('address', { length: 255 }).notNull().default('Addis Ababa, Ethiopia'),
  phone: varchar('phone', { length: 50 }).notNull().default('+251 9XX XXX XXX'),
  email: varchar('email', { length: 255 }).notNull().default(''),
  workingDays: text('working_days')
    .array()
    .notNull()
    .default([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]),
  workingHoursStart: varchar('working_hours_start', { length: 5 })
    .notNull()
    .default('08:00'),
  workingHoursEnd: varchar('working_hours_end', { length: 5 })
    .notNull()
    .default('17:00'),
  holidays: jsonb('holidays').notNull().default([]),
  logoData: text('logo_data'),
  logoMimeType: varchar('logo_mime_type', { length: 100 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
