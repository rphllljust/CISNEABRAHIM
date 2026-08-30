CREATE TYPE "evt"."outbox_event_status" AS ENUM('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');
--> statement-breakpoint
CREATE TABLE "evt"."outbox_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" "evt"."domain_event_type" NOT NULL,
  "aggregate_type" text NOT NULL,
  "aggregate_id" uuid NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "payload_version" integer NOT NULL DEFAULT 1,
  "occurred_at" timestamp with time zone NOT NULL DEFAULT now(),
  "available_at" timestamp with time zone NOT NULL DEFAULT now(),
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 10,
  "status" "evt"."outbox_event_status" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" text NOT NULL,
  "ordering_key" text NOT NULL,
  "sequence_number" bigserial NOT NULL,
  "lease_owner" text,
  "lease_expires_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "last_error" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "outbox_events_payload_version_positive_chk" CHECK ("payload_version" >= 1),
  CONSTRAINT "outbox_events_attempts_non_negative_chk" CHECK ("attempts" >= 0),
  CONSTRAINT "outbox_events_max_attempts_positive_chk" CHECK ("max_attempts" >= 1),
  CONSTRAINT "outbox_events_idempotency_key_not_empty_chk" CHECK (length(trim("idempotency_key")) > 0),
  CONSTRAINT "outbox_events_ordering_key_not_empty_chk" CHECK (length(trim("ordering_key")) > 0),
  CONSTRAINT "outbox_events_aggregate_type_not_empty_chk" CHECK (length(trim("aggregate_type")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_events_idempotency_key_uidx" ON "evt"."outbox_events" ("idempotency_key");
--> statement-breakpoint
CREATE INDEX "outbox_events_poll_idx" ON "evt"."outbox_events" ("status", "available_at", "ordering_key", "sequence_number");
--> statement-breakpoint
CREATE INDEX "outbox_events_lease_expires_idx" ON "evt"."outbox_events" ("lease_expires_at") WHERE "status" = 'PROCESSING';
