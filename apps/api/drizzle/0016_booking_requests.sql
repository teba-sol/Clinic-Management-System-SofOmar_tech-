CREATE TYPE "public"."booking_request_status" AS ENUM('pending', 'contacted', 'converted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."preferred_time" AS ENUM('morning', 'afternoon', 'evening');--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"department" varchar(100) NOT NULL,
	"preferred_date" date NOT NULL,
	"preferred_time" "preferred_time" NOT NULL,
	"doctor_id" uuid,
	"reason" text,
	"status" "booking_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;