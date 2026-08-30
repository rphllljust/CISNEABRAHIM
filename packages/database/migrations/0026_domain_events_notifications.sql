CREATE SCHEMA IF NOT EXISTS "evt";
--> statement-breakpoint
CREATE TYPE "evt"."domain_event_type" AS ENUM(
  'SERVICE_REQUEST_SUBMITTED',
  'SERVICE_ORDER_RELEASED',
  'SERVICE_ORDER_ASSIGNED',
  'SERVICE_ORDER_COMPLETED',
  'MEASUREMENT_SUBMITTED',
  'MEASUREMENT_APPROVED',
  'BILLING_READY',
  'PAYMENT_OVERDUE'
);
--> statement-breakpoint
CREATE TYPE "evt"."notification_intent_status" AS ENUM('PENDING', 'DISPATCHED', 'CANCELLED');
--> statement-breakpoint
CREATE TABLE "evt"."domain_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" "evt"."domain_event_type" NOT NULL,
  "aggregate_type" text NOT NULL,
  "aggregate_id" uuid NOT NULL,
  "payload_version" integer NOT NULL DEFAULT 1,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "occurred_at" timestamp with time zone NOT NULL DEFAULT now(),
  "idempotency_key" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "domain_events_payload_version_positive_chk" CHECK ("payload_version" >= 1),
  CONSTRAINT "domain_events_aggregate_type_not_empty_chk" CHECK (length(trim("aggregate_type")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "domain_events_idempotency_key_uidx" ON "evt"."domain_events" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "domain_events_aggregate_idx" ON "evt"."domain_events" ("aggregate_type", "aggregate_id");
--> statement-breakpoint
CREATE INDEX "domain_events_event_type_occurred_at_idx" ON "evt"."domain_events" ("event_type", "occurred_at");
--> statement-breakpoint
CREATE TABLE "evt"."notification_intents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "domain_event_id" uuid NOT NULL REFERENCES "evt"."domain_events"("id") ON DELETE restrict,
  "intent_key" text NOT NULL,
  "audience_scope" text NOT NULL,
  "template_key" text NOT NULL,
  "payload_version" integer NOT NULL DEFAULT 1,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" "evt"."notification_intent_status" NOT NULL DEFAULT 'PENDING',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notification_intents_payload_version_positive_chk" CHECK ("payload_version" >= 1),
  CONSTRAINT "notification_intents_intent_key_not_empty_chk" CHECK (length(trim("intent_key")) > 0),
  CONSTRAINT "notification_intents_audience_scope_not_empty_chk" CHECK (length(trim("audience_scope")) > 0),
  CONSTRAINT "notification_intents_template_key_not_empty_chk" CHECK (length(trim("template_key")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "notification_intents_domain_event_intent_key_uidx" ON "evt"."notification_intents" ("domain_event_id", "intent_key");
--> statement-breakpoint
CREATE INDEX "notification_intents_status_created_at_idx" ON "evt"."notification_intents" ("status", "created_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "evt".prevent_domain_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'domain_events is append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "domain_events_no_update"
BEFORE UPDATE OR DELETE ON "evt"."domain_events"
FOR EACH ROW
EXECUTE FUNCTION "evt".prevent_domain_event_mutation();
