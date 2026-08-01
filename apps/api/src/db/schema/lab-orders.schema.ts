import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { visits } from './visits.schema';
import { patients } from './patients.schema';
import { users } from './users.schema';

export const labOrderStatusEnum = pgEnum('lab_order_status', [
  'ordered', 'sample_collected', 'in_progress', 'completed', 'cancelled',
]);

export const labOrders = pgTable('lab_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  orderedByDoctorId: uuid('ordered_by_doctor_id').notNull().references(() => users.id),
  testType: text('test_type').notNull(),
  status: labOrderStatusEnum('status').notNull().default('ordered'),
  resultText: text('result_text'),
  resultPdfUrl: text('result_pdf_url'),
  completedByLabTechId: uuid('completed_by_lab_tech_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
