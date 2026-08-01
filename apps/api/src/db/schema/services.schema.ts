import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  defaultPrice: numeric('default_price', { precision: 10, scale: 2 }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
