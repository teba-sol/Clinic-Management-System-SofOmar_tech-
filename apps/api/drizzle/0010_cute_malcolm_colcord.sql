ALTER TABLE "visits" DROP CONSTRAINT "visits_appointment_id_appointments_id_fk";
--> statement-breakpoint
ALTER TABLE "visits" ALTER COLUMN "appointment_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;