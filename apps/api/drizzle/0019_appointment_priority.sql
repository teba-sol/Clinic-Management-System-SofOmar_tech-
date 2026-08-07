CREATE TYPE "public"."appointment_priority" AS ENUM('routine', 'urgent', 'emergency');--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "priority" "appointment_priority" DEFAULT 'routine' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "priority_reason" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "priority_changed_by" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "priority_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_priority_changed_by_users_id_fk" FOREIGN KEY ("priority_changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
