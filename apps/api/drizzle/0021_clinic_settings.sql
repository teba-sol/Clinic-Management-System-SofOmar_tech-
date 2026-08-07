ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(50);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinic_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"clinic_name" varchar(255) DEFAULT 'SofOmar Clinic' NOT NULL,
	"tagline" varchar(255) DEFAULT 'Your trusted health partner' NOT NULL,
	"address" varchar(255) DEFAULT 'Addis Ababa, Ethiopia' NOT NULL,
	"phone" varchar(50) DEFAULT '+251 9XX XXX XXX' NOT NULL,
	"email" varchar(255) DEFAULT '' NOT NULL,
	"working_days" text[] DEFAULT '{"monday","tuesday","wednesday","thursday","friday","saturday"}' NOT NULL,
	"working_hours_start" varchar(5) DEFAULT '08:00' NOT NULL,
	"working_hours_end" varchar(5) DEFAULT '17:00' NOT NULL,
	"holidays" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"logo_data" text,
	"logo_mime_type" varchar(100),
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "clinic_settings" ("id", "clinic_name") VALUES (1, 'SofOmar Clinic') ON CONFLICT ("id") DO NOTHING;
