CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_legal_name_trgm_idx" ON "pty"."clients" USING gin ("legal_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_trade_name_trgm_idx" ON "pty"."clients" USING gin ("trade_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_orders_order_number_pattern_idx" ON "so"."service_orders" ("order_number" text_pattern_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_orders_internal_code_pattern_idx" ON "so"."service_orders" ("internal_code" text_pattern_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "physical_assets_name_trgm_idx" ON "ast"."physical_assets" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_title_trgm_idx" ON "doc"."documents" USING gin ("title" gin_trgm_ops);
