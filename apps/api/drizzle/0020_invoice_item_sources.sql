ALTER TABLE "invoice_items" ADD COLUMN "source_type" text;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "source_id" text;--> statement-breakpoint
CREATE INDEX "invoice_items_source_idx" ON "invoice_items" USING btree ("source_type","source_id");
