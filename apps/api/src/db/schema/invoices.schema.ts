import { pgTable, uuid, text, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { patients } from './patients.schema';
import { visits } from './visits.schema';
import { services } from './services.schema';

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'partial', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'telebirr', 'cbe_birr', 'insurance']);

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'set null' }),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }).notNull().default('0'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  paymentMethod: paymentMethodEnum('payment_method'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
});
