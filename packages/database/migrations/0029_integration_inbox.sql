CREATE SCHEMA IF NOT EXISTS "int";
--> statement-breakpoint
CREATE TYPE "int"."integration_inbox_status" AS ENUM(
  'RECEIVED',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'INVALID'
);
--> statement-breakpoint
CREATE TYPE "int"."integration_inbox_error_class" AS ENUM(
  'TRANSIENT',
  'PERMANENT',
  'INVALID_PAYLOAD',
  'AUTH_FAILURE'
);
--> statement-breakpoint
CREATE TABLE "int"."integration_inbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" text NOT NULL,
  "external_message_id" text NOT NULL,
  "event_type" text NOT NULL,
  "received_at" timestamp with time zone NOT NULL DEFAULT now(),
  "payload_hash" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" "int"."integration_inbox_status" NOT NULL DEFAULT 'RECEIVED',
  "processed_at" timestamp with time zone,
  "error_classification" "int"."integration_inbox_error_class",
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 5,
  "run_after" timestamp with time zone NOT NULL DEFAULT now(),
  "last_error" text,
  "lease_owner" text,
  "lease_expires_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "integration_inbox_provider_not_empty_chk" CHECK (length(trim("provider")) > 0),
  CONSTRAINT "integration_inbox_external_message_id_not_empty_chk" CHECK (length(trim("external_message_id")) > 0),
  CONSTRAINT "integration_inbox_event_type_not_empty_chk" CHECK (length(trim("event_type")) > 0),
  CONSTRAINT "integration_inbox_payload_hash_not_empty_chk" CHECK (length(trim("payload_hash")) > 0),
  CONSTRAINT "integration_inbox_attempts_non_negative_chk" CHECK ("attempts" >= 0),
  CONSTRAINT "integration_inbox_max_attempts_positive_chk" CHECK ("max_attempts" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "integration_inbox_provider_external_message_uidx"
  ON "int"."integration_inbox" ("provider", "external_message_id");
--> statement-breakpoint
CREATE INDEX "integration_inbox_poll_idx"
  ON "int"."integration_inbox" ("status", "run_after", "received_at");
--> statement-breakpoint
CREATE INDEX "integration_inbox_lease_expires_idx"
  ON "int"."integration_inbox" ("lease_expires_at")
  WHERE "status" = 'PROCESSING';
--> statement-breakpoint
CREATE TABLE "int"."integration_inbox_effects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "inbox_id" uuid NOT NULL REFERENCES "int"."integration_inbox"("id") ON DELETE restrict,
  "effect_key" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "integration_inbox_effects_effect_key_not_empty_chk" CHECK (length(trim("effect_key")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "integration_inbox_effects_effect_key_uidx"
  ON "int"."integration_inbox_effects" ("effect_key");
