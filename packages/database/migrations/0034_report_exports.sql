CREATE SCHEMA IF NOT EXISTS "rpt";
--> statement-breakpoint
CREATE TYPE "rpt"."report_export_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "rpt"."report_format" AS ENUM('CSV', 'XLSX', 'PDF');
--> statement-breakpoint
CREATE TABLE "rpt"."report_exports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "report_type" text NOT NULL,
  "format" "rpt"."report_format" NOT NULL DEFAULT 'CSV',
  "status" "rpt"."report_export_status" NOT NULL DEFAULT 'PENDING',
  "contract" jsonb NOT NULL,
  "background_job_id" uuid,
  "storage_key" text,
  "row_count" integer,
  "file_size_bytes" bigint,
  "error_message" text,
  "requested_by_identity_id" uuid NOT NULL,
  "requested_session_id" text,
  "correlation_id" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone,
  CONSTRAINT "report_exports_report_type_not_empty_chk" CHECK (length(trim("report_type")) > 0)
);
--> statement-breakpoint
CREATE INDEX "report_exports_status_created_idx" ON "rpt"."report_exports" ("status", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX "report_exports_actor_created_idx" ON "rpt"."report_exports" ("requested_by_identity_id", "created_at" DESC);
