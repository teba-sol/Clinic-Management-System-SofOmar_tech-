CREATE TYPE "public"."blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mrn" varchar(20) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" "gender" NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"address" text,
	"blood_group" "blood_group" DEFAULT 'unknown',
	"allergies" text,
	"chronic_conditions" text,
	"emergency_contact_name" varchar(200),
	"emergency_contact_phone" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patients_mrn_unique" UNIQUE("mrn")
);
