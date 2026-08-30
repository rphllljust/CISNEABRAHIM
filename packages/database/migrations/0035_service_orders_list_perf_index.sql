CREATE INDEX IF NOT EXISTS "service_orders_unit_status_created_idx"
  ON "so"."service_orders" ("unit_id", "status", "created_at" DESC);
