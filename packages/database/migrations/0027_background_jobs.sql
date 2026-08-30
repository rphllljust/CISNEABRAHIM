CREATE SCHEMA IF NOT EXISTS "plt";
--> statement-breakpoint
CREATE TYPE "plt"."background_job_kind" AS ENUM(
  'NOTIFICATION',
  'INTEGRATION',
  'DOCUMENT_PROCESSING',
  'REPORT_GENERATION'
);
--> statement-breakpoint
CREATE TYPE "plt"."background_job_status" AS ENUM(
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'DEAD'
);
--> statement-breakpoint
CREATE TYPE "plt"."background_job_failure_class" AS ENUM('TRANSIENT', 'PERMANENT');
--> statement-breakpoint
CREATE TABLE "plt"."background_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_kind" "plt"."background_job_kind" NOT NULL,
  "status" "plt"."background_job_status" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" text NOT NULL,
  "payload_version" integer NOT NULL DEFAULT 1,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "priority" integer NOT NULL DEFAULT 0,
  "attempt_count" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 5,
  "run_after" timestamp with time zone NOT NULL DEFAULT now(),
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "lease_owner" text,
  "lease_expires_at" timestamp with time zone,
  "last_error" text,
  "failure_class" "plt"."background_job_failure_class",
  "correlation_id" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "background_jobs_payload_version_positive_chk" CHECK ("payload_version" >= 1),
  CONSTRAINT "background_jobs_max_attempts_positive_chk" CHECK ("max_attempts" >= 1),
  CONSTRAINT "background_jobs_attempt_count_non_negative_chk" CHECK ("attempt_count" >= 0),
  CONSTRAINT "background_jobs_idempotency_key_not_empty_chk" CHECK (length(trim("idempotency_key")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "background_jobs_idempotency_key_uidx" ON "plt"."background_jobs" ("idempotency_key");
--> statement-breakpoint
CREATE INDEX "background_jobs_poll_idx" ON "plt"."background_jobs" ("status", "run_after", "priority", "created_at");
--> statement-breakpoint
CREATE INDEX "background_jobs_lease_expires_idx" ON "plt"."background_jobs" ("lease_expires_at") WHERE "status" = 'RUNNING';
--> statement-breakpoint
CREATE INDEX "background_jobs_kind_status_idx" ON "plt"."background_jobs" ("job_kind", "status");
