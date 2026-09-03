ALTER TABLE "com"."purchase_order_items" ADD COLUMN "commercial_snapshot" jsonb;
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders" ADD COLUMN "commercial_snapshot" jsonb;
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders" ADD COLUMN "items_line_total_amount" numeric(18, 4);