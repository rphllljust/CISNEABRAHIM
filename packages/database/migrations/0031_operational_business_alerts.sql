CREATE SCHEMA IF NOT EXISTS "alt";
--> statement-breakpoint
CREATE TYPE "alt"."business_alert_type" AS ENUM(
  'SERVICE_ORDER_DUE_SOON',
  'SERVICE_ORDER_OVERDUE',
  'SERVICE_ORDER_STALLED',
  'MEASUREMENT_AGING',
  'BILLING_AGING',
  'PAYMENT_OVERDUE'
);
--> statement-breakpoint
CREATE TYPE "alt"."business_alert_severity" AS ENUM('WARNING', 'CRITICAL');
--> statement-breakpoint
CREATE TYPE "alt"."business_alert_status" AS ENUM('ACTIVE', 'RESOLVED');
--> statement-breakpoint
CREATE TABLE "alt"."business_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "alert_type" "alt"."business_alert_type" NOT NULL,
  "severity" "alt"."business_alert_severity" NOT NULL,
  "status" "alt"."business_alert_status" NOT NULL DEFAULT 'ACTIVE',
  "aggregate_type" text NOT NULL,
  "aggregate_id" uuid NOT NULL,
  "policy_window" text NOT NULL,
  "deduplication_key" text NOT NULL,
  "condition_phase" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "entity_href" text NOT NULL,
  "unit_id" text,
  "client_id" uuid,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "triggered_at" timestamp with time zone NOT NULL,
  "resolved_at" timestamp with time zone,
  "last_seen_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "business_alerts_title_not_empty_chk" CHECK (length(trim("title")) > 0),
  CONSTRAINT "business_alerts_message_not_empty_chk" CHECK (length(trim("message")) > 0),
  CONSTRAINT "business_alerts_entity_href_not_empty_chk" CHECK (length(trim("entity_href")) > 0),
  CONSTRAINT "business_alerts_policy_window_not_empty_chk" CHECK (length(trim("policy_window")) > 0),
  CONSTRAINT "business_alerts_deduplication_key_not_empty_chk" CHECK (length(trim("deduplication_key")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "business_alerts_dedup_active_uidx" ON "alt"."business_alerts" ("deduplication_key") WHERE "status" = 'ACTIVE';
--> statement-breakpoint
CREATE INDEX "business_alerts_status_type_idx" ON "alt"."business_alerts" ("status", "alert_type", "triggered_at" DESC);
--> statement-breakpoint
CREATE INDEX "business_alerts_unit_status_idx" ON "alt"."business_alerts" ("unit_id", "status", "triggered_at" DESC);
--> statement-breakpoint
CREATE INDEX "business_alerts_aggregate_idx" ON "alt"."business_alerts" ("aggregate_type", "aggregate_id", "status");
