CREATE SCHEMA "infrastructure";
--> statement-breakpoint
CREATE TABLE "infrastructure"."schema_baseline" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "infrastructure"."schema_baseline_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"baseline_version" text NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "infrastructure"."schema_baseline" ("baseline_version")
VALUES ('prompt-17-technical-baseline');
