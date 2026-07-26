import { pgTable, uuid, varchar, date, pgEnum, timestamp, text } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const bloodGroupEnum = pgEnum('blood_group', [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown',
]);

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  mrn: varchar('mrn', { length: 20 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  gender: genderEnum('gender').notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),

  bloodGroup: bloodGroupEnum('blood_group').default('unknown'),
  allergies: text('allergies'),
  chronicConditions: text('chronic_conditions'),

  emergencyContactName: varchar('emergency_contact_name', { length: 200 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
