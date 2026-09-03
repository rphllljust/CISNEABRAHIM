ALTER TABLE "com"."proposal_items" ADD COLUMN "commercial_snapshot" jsonb;
--> statement-breakpoint
ALTER TABLE "com"."proposal_versions" ADD COLUMN "items_sale_total_amount" numeric(18, 4);
--> statement-breakpoint
ALTER TABLE "com"."proposal_versions" ADD COLUMN "items_internal_cost_total_amount" numeric(18, 4);