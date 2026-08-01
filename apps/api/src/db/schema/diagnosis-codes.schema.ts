import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const diagnosisCodes = pgTable('diagnosis_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  description: text('description').notNull(),
  category: text('category'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
