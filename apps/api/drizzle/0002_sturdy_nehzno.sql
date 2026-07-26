CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TABLE "doctor_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_duration_minutes" integer DEFAULT 20 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;