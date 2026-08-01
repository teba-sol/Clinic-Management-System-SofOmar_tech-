ALTER TYPE "public"."appointment_status" ADD VALUE 'triaged';--> statement-breakpoint
CREATE TABLE "vitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"recorded_by_nurse_id" uuid NOT NULL,
	"blood_pressure" text,
	"temperature" text,
	"pulse" text,
	"weight" text,
	"height" text,
	"bmi" numeric,
	"chief_complaint" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_recorded_by_nurse_id_users_id_fk" FOREIGN KEY ("recorded_by_nurse_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;