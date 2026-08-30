CREATE SCHEMA IF NOT EXISTS "ntf";
--> statement-breakpoint
CREATE TYPE "ntf"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'WHATSAPP');
--> statement-breakpoint
CREATE TYPE "ntf"."notification_status" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED');
--> statement-breakpoint
CREATE TYPE "ntf"."delivery_attempt_status" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED');
--> statement-breakpoint
CREATE TABLE "ntf"."notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "notification_intent_id" uuid NOT NULL REFERENCES "evt"."notification_intents"("id") ON DELETE restrict,
  "channel" "ntf"."notification_channel" NOT NULL,
  "recipient_ref" text NOT NULL,
  "template_key" text NOT NULL,
  "status" "ntf"."notification_status" NOT NULL DEFAULT 'PENDING',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notifications_recipient_ref_not_empty_chk" CHECK (length(trim("recipient_ref")) > 0),
  CONSTRAINT "notifications_template_key_not_empty_chk" CHECK (length(trim("template_key")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_intent_channel_uidx" ON "ntf"."notifications" ("notification_intent_id", "channel");
--> statement-breakpoint
CREATE INDEX "notifications_status_created_at_idx" ON "ntf"."notifications" ("status", "created_at");
--> statement-breakpoint
CREATE TABLE "ntf"."delivery_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "notification_id" uuid NOT NULL REFERENCES "ntf"."notifications"("id") ON DELETE restrict,
  "channel" "ntf"."notification_channel" NOT NULL,
  "recipient_ref" text NOT NULL,
  "provider" text NOT NULL,
  "attempt" integer NOT NULL,
  "status" "ntf"."delivery_attempt_status" NOT NULL,
  "provider_message_id" text,
  "sent_at" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  "failure_code" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "delivery_attempts_attempt_positive_chk" CHECK ("attempt" >= 1),
  CONSTRAINT "delivery_attempts_provider_not_empty_chk" CHECK (length(trim("provider")) > 0),
  CONSTRAINT "delivery_attempts_recipient_ref_not_empty_chk" CHECK (length(trim("recipient_ref")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_attempts_notification_attempt_uidx" ON "ntf"."delivery_attempts" ("notification_id", "attempt");
--> statement-breakpoint
CREATE INDEX "delivery_attempts_provider_message_id_idx" ON "ntf"."delivery_attempts" ("provider_message_id") WHERE "provider_message_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "delivery_attempts_notification_id_idx" ON "ntf"."delivery_attempts" ("notification_id");
