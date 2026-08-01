ALTER TABLE "prescriptions" ALTER COLUMN "visit_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lab_orders" ALTER COLUMN "visit_id" DROP NOT NULL;