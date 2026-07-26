CREATE TYPE "public"."lab_order_status" AS ENUM('ordered', 'sample_collected', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "lab_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"ordered_by_doctor_id" uuid NOT NULL,
	"test_type" text NOT NULL,
	"status" "lab_order_status" DEFAULT 'ordered' NOT NULL,
	"result_text" text,
	"result_pdf_url" text,
	"completed_by_lab_tech_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_ordered_by_doctor_id_users_id_fk" FOREIGN KEY ("ordered_by_doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_completed_by_lab_tech_id_users_id_fk" FOREIGN KEY ("completed_by_lab_tech_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;