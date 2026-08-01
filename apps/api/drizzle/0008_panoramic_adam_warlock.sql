ALTER TABLE "lab_orders" DROP CONSTRAINT "lab_orders_visit_id_visits_id_fk";
--> statement-breakpoint
ALTER TABLE "lab_orders" ALTER COLUMN "visit_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE set null ON UPDATE no action;