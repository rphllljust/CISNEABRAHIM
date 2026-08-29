ALTER TABLE "cat"."service_definitions" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "cat"."service_definitions" ADD CONSTRAINT "service_definitions_version_positive_chk" CHECK ("cat"."service_definitions"."version" >= 1);
