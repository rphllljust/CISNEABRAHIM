CREATE SCHEMA "doc";
--> statement-breakpoint
CREATE TYPE "doc"."document_status" AS ENUM('ACTIVE', 'ARCHIVED');
--> statement-breakpoint
CREATE TABLE "doc"."stored_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"sha256_hash" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"original_filename" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stored_objects_storage_key_not_empty_chk" CHECK (length(trim("doc"."stored_objects"."storage_key")) > 0),
	CONSTRAINT "stored_objects_sha256_not_empty_chk" CHECK (length(trim("doc"."stored_objects"."sha256_hash")) > 0),
	CONSTRAINT "stored_objects_mime_type_not_empty_chk" CHECK (length(trim("doc"."stored_objects"."mime_type")) > 0),
	CONSTRAINT "stored_objects_original_filename_not_empty_chk" CHECK (length(trim("doc"."stored_objects"."original_filename")) > 0),
	CONSTRAINT "stored_objects_byte_size_positive_chk" CHECK ("doc"."stored_objects"."byte_size" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "stored_objects_storage_key_uidx" ON "doc"."stored_objects" USING btree ("storage_key");
--> statement-breakpoint
CREATE INDEX "stored_objects_sha256_hash_idx" ON "doc"."stored_objects" USING btree ("sha256_hash");
--> statement-breakpoint
CREATE TABLE "doc"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category_code" text NOT NULL,
	"classification_code" text DEFAULT 'INTERNAL' NOT NULL,
	"status" "doc"."document_status" DEFAULT 'ACTIVE' NOT NULL,
	"unit_id" text NOT NULL,
	"current_version_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "documents_title_not_empty_chk" CHECK (length(trim("doc"."documents"."title")) > 0),
	CONSTRAINT "documents_category_code_not_empty_chk" CHECK (length(trim("doc"."documents"."category_code")) > 0),
	CONSTRAINT "documents_classification_code_not_empty_chk" CHECK (length(trim("doc"."documents"."classification_code")) > 0),
	CONSTRAINT "documents_unit_id_not_empty_chk" CHECK (length(trim("doc"."documents"."unit_id")) > 0),
	CONSTRAINT "documents_current_version_positive_chk" CHECK ("doc"."documents"."current_version_number" IS NULL OR "doc"."documents"."current_version_number" >= 1)
);
--> statement-breakpoint
CREATE INDEX "documents_unit_id_idx" ON "doc"."documents" USING btree ("unit_id");
--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "doc"."documents" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "documents_category_code_idx" ON "doc"."documents" USING btree ("category_code");
--> statement-breakpoint
ALTER TABLE "doc"."documents" ADD CONSTRAINT "documents_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "doc"."documents" ADD CONSTRAINT "documents_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "doc"."document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"stored_object_id" uuid NOT NULL,
	"uploaded_by_identity_id" uuid NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"superseded_at" timestamp with time zone,
	CONSTRAINT "document_versions_version_positive_chk" CHECK ("doc"."document_versions"."version_number" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "document_versions_document_version_uidx" ON "doc"."document_versions" USING btree ("document_id", "version_number");
--> statement-breakpoint
CREATE INDEX "document_versions_document_id_idx" ON "doc"."document_versions" USING btree ("document_id");
--> statement-breakpoint
CREATE INDEX "document_versions_stored_object_id_idx" ON "doc"."document_versions" USING btree ("stored_object_id");
--> statement-breakpoint
ALTER TABLE "doc"."document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "doc"."documents"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "doc"."document_versions" ADD CONSTRAINT "document_versions_stored_object_id_stored_objects_id_fk" FOREIGN KEY ("stored_object_id") REFERENCES "doc"."stored_objects"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "doc"."document_versions" ADD CONSTRAINT "document_versions_uploaded_by_identity_id_identities_id_fk" FOREIGN KEY ("uploaded_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
