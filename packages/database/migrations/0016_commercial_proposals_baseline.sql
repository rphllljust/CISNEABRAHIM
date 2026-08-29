CREATE SCHEMA "com";
--> statement-breakpoint
CREATE TYPE "com"."proposal_version_status" AS ENUM('DRAFT', 'ISSUED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "com"."proposal_pricing_structure" AS ENUM('GLOBAL_PRICE', 'ITEMIZED');
--> statement-breakpoint
CREATE TYPE "com"."proposal_item_kind" AS ENUM('SERVICE', 'MATERIAL', 'LABOR', 'EQUIPMENT', 'TRANSPORT', 'OTHER');
--> statement-breakpoint
CREATE TABLE "com"."proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_code" text NOT NULL,
	"client_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"title" text NOT NULL,
	"current_version_number" integer,
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "proposals_proposal_code_not_empty_chk" CHECK (length(trim("com"."proposals"."proposal_code")) > 0),
	CONSTRAINT "proposals_title_not_empty_chk" CHECK (length(trim("com"."proposals"."title")) > 0),
	CONSTRAINT "proposals_unit_id_not_empty_chk" CHECK (length(trim("com"."proposals"."unit_id")) > 0),
	CONSTRAINT "proposals_row_version_positive_chk" CHECK ("com"."proposals"."row_version" >= 1),
	CONSTRAINT "proposals_current_version_positive_chk" CHECK ("com"."proposals"."current_version_number" IS NULL OR "com"."proposals"."current_version_number" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_proposal_code_uidx" ON "com"."proposals" USING btree ("proposal_code");
--> statement-breakpoint
CREATE INDEX "proposals_client_id_idx" ON "com"."proposals" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX "proposals_unit_id_idx" ON "com"."proposals" USING btree ("unit_id");
--> statement-breakpoint
ALTER TABLE "com"."proposals" ADD CONSTRAINT "proposals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "pty"."clients"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposals" ADD CONSTRAINT "proposals_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposals" ADD CONSTRAINT "proposals_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "com"."proposal_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"status" "com"."proposal_version_status" DEFAULT 'DRAFT' NOT NULL,
	"pricing_structure" "com"."proposal_pricing_structure" NOT NULL,
	"currency_code" text DEFAULT 'BRL' NOT NULL,
	"global_sale_price_amount" numeric(18, 4),
	"global_internal_cost_amount" numeric(18, 4),
	"commercial_terms" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"client_snapshot" jsonb,
	"valid_until" timestamp with time zone,
	"notes" text,
	"issued_at" timestamp with time zone,
	"issued_by_identity_id" uuid,
	"superseded_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"accepted_by_identity_id" uuid,
	"acceptance_origin_code" text,
	"acceptance_evidence_document_id" uuid,
	"rejected_at" timestamp with time zone,
	"rejected_by_identity_id" uuid,
	"rejection_reason" text,
	"expired_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_identity_id" uuid,
	"cancellation_reason" text,
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_versions_version_positive_chk" CHECK ("com"."proposal_versions"."version_number" >= 1),
	CONSTRAINT "proposal_versions_row_version_positive_chk" CHECK ("com"."proposal_versions"."row_version" >= 1),
	CONSTRAINT "proposal_versions_currency_code_chk" CHECK (length(trim("com"."proposal_versions"."currency_code")) = 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_versions_proposal_version_uidx" ON "com"."proposal_versions" USING btree ("proposal_id", "version_number");
--> statement-breakpoint
CREATE INDEX "proposal_versions_status_idx" ON "com"."proposal_versions" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "com"."proposal_versions" ADD CONSTRAINT "proposal_versions_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "com"."proposals"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposal_versions" ADD CONSTRAINT "proposal_versions_issued_by_identity_id_identities_id_fk" FOREIGN KEY ("issued_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposal_versions" ADD CONSTRAINT "proposal_versions_accepted_by_identity_id_identities_id_fk" FOREIGN KEY ("accepted_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposal_versions" ADD CONSTRAINT "proposal_versions_rejected_by_identity_id_identities_id_fk" FOREIGN KEY ("rejected_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposal_versions" ADD CONSTRAINT "proposal_versions_cancelled_by_identity_id_identities_id_fk" FOREIGN KEY ("cancelled_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposal_versions" ADD CONSTRAINT "proposal_versions_acceptance_evidence_document_id_documents_id_fk" FOREIGN KEY ("acceptance_evidence_document_id") REFERENCES "doc"."documents"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "com"."proposal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_version_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"item_kind" "com"."proposal_item_kind" DEFAULT 'OTHER' NOT NULL,
	"description" text NOT NULL,
	"service_definition_id" uuid,
	"service_definition_version_id" uuid,
	"service_snapshot" jsonb,
	"quantity" numeric(18, 4),
	"unit_code" text,
	"unit_sale_price_amount" numeric(18, 4),
	"unit_internal_cost_amount" numeric(18, 4),
	"line_sale_amount" numeric(18, 4),
	"line_internal_cost_amount" numeric(18, 4),
	CONSTRAINT "proposal_items_line_number_positive_chk" CHECK ("com"."proposal_items"."line_number" >= 1),
	CONSTRAINT "proposal_items_description_not_empty_chk" CHECK (length(trim("com"."proposal_items"."description")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_items_version_line_uidx" ON "com"."proposal_items" USING btree ("proposal_version_id", "line_number");
--> statement-breakpoint
ALTER TABLE "com"."proposal_items" ADD CONSTRAINT "proposal_items_proposal_version_id_proposal_versions_id_fk" FOREIGN KEY ("proposal_version_id") REFERENCES "com"."proposal_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposal_items" ADD CONSTRAINT "proposal_items_service_definition_id_service_definitions_id_fk" FOREIGN KEY ("service_definition_id") REFERENCES "cat"."service_definitions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposal_items" ADD CONSTRAINT "proposal_items_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "com"."proposal_document_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_version_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"link_purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	CONSTRAINT "proposal_document_links_purpose_not_empty_chk" CHECK (length(trim("com"."proposal_document_links"."link_purpose")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_document_links_version_document_purpose_uidx" ON "com"."proposal_document_links" USING btree ("proposal_version_id", "document_id", "link_purpose");
--> statement-breakpoint
ALTER TABLE "com"."proposal_document_links" ADD CONSTRAINT "proposal_document_links_proposal_version_id_proposal_versions_id_fk" FOREIGN KEY ("proposal_version_id") REFERENCES "com"."proposal_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposal_document_links" ADD CONSTRAINT "proposal_document_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "doc"."documents"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."proposal_document_links" ADD CONSTRAINT "proposal_document_links_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
