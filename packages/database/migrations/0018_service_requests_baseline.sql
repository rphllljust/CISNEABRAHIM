CREATE SCHEMA "sr";
--> statement-breakpoint
CREATE TYPE "sr"."service_request_status" AS ENUM(
	'DRAFT',
	'SUBMITTED',
	'UNDER_REVIEW',
	'APPROVED',
	'REJECTED',
	'CANCELLED',
	'CONVERTED'
);
--> statement-breakpoint
CREATE TYPE "sr"."service_request_origin" AS ENUM(
	'WHATSAPP',
	'PHONE',
	'EMAIL',
	'PURCHASE_ORDER',
	'CONTRACT',
	'PROPOSAL_ACCEPTANCE',
	'DIRECT_REQUEST',
	'OTHER'
);
--> statement-breakpoint
CREATE TYPE "sr"."service_request_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');
--> statement-breakpoint
CREATE TABLE "sr"."service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_code" text NOT NULL,
	"unit_id" text NOT NULL,
	"status" "sr"."service_request_status" DEFAULT 'DRAFT' NOT NULL,
	"origin_source" "sr"."service_request_origin" NOT NULL,
	"external_contact" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"external_origin_reference" text,
	"client_id" uuid,
	"service_definition_id" uuid,
	"service_definition_version_id" uuid,
	"description" text,
	"location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"desired_start_at" timestamp with time zone,
	"desired_end_at" timestamp with time zone,
	"priority" "sr"."service_request_priority",
	"operational_notes" text,
	"proposal_id" uuid,
	"purchase_order_id" uuid,
	"submitted_at" timestamp with time zone,
	"submitted_by_identity_id" uuid,
	"review_started_at" timestamp with time zone,
	"review_started_by_identity_id" uuid,
	"approved_at" timestamp with time zone,
	"approved_by_identity_id" uuid,
	"rejected_at" timestamp with time zone,
	"rejected_by_identity_id" uuid,
	"rejection_reason" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_identity_id" uuid,
	"cancellation_reason" text,
	"converted_at" timestamp with time zone,
	"converted_by_identity_id" uuid,
	"converted_service_order_id" uuid,
	"idempotency_key" text,
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "service_requests_request_code_not_empty_chk" CHECK (length(trim("sr"."service_requests"."request_code")) > 0),
	CONSTRAINT "service_requests_unit_id_not_empty_chk" CHECK (length(trim("sr"."service_requests"."unit_id")) > 0),
	CONSTRAINT "service_requests_row_version_positive_chk" CHECK ("sr"."service_requests"."row_version" >= 1),
	CONSTRAINT "service_requests_rejection_reason_when_rejected_chk" CHECK (
		"status" <> 'REJECTED'::"sr"."service_request_status"
		OR ("rejection_reason" IS NOT NULL AND length(trim("rejection_reason")) > 0)
	),
	CONSTRAINT "service_requests_cancellation_reason_when_cancelled_chk" CHECK (
		"status" <> 'CANCELLED'::"sr"."service_request_status"
		OR ("cancellation_reason" IS NOT NULL AND length(trim("cancellation_reason")) > 0)
	),
	CONSTRAINT "service_requests_converted_service_order_when_converted_chk" CHECK (
		"status" <> 'CONVERTED'::"sr"."service_request_status"
		OR "converted_service_order_id" IS NOT NULL
	)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_requests_request_code_uidx" ON "sr"."service_requests" USING btree ("request_code");
--> statement-breakpoint
CREATE UNIQUE INDEX "service_requests_idempotency_key_uidx" ON "sr"."service_requests" USING btree ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "service_requests_status_idx" ON "sr"."service_requests" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "service_requests_unit_id_idx" ON "sr"."service_requests" USING btree ("unit_id");
--> statement-breakpoint
CREATE INDEX "service_requests_client_id_idx" ON "sr"."service_requests" USING btree ("client_id");
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "pty"."clients"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_service_definition_id_service_definitions_id_fk" FOREIGN KEY ("service_definition_id") REFERENCES "cat"."service_definitions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "com"."proposals"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "com"."purchase_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_submitted_by_identity_id_identities_id_fk" FOREIGN KEY ("submitted_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_review_started_by_identity_id_identities_id_fk" FOREIGN KEY ("review_started_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_approved_by_identity_id_identities_id_fk" FOREIGN KEY ("approved_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_rejected_by_identity_id_identities_id_fk" FOREIGN KEY ("rejected_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_cancelled_by_identity_id_identities_id_fk" FOREIGN KEY ("cancelled_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_requests" ADD CONSTRAINT "service_requests_converted_by_identity_id_identities_id_fk" FOREIGN KEY ("converted_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "sr"."service_request_document_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_request_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"link_purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	CONSTRAINT "service_request_document_links_purpose_not_empty_chk" CHECK (length(trim("sr"."service_request_document_links"."link_purpose")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_request_document_links_request_document_purpose_uidx" ON "sr"."service_request_document_links" USING btree ("service_request_id", "document_id", "link_purpose");
--> statement-breakpoint
ALTER TABLE "sr"."service_request_document_links" ADD CONSTRAINT "service_request_document_links_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "sr"."service_requests"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_request_document_links" ADD CONSTRAINT "service_request_document_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "doc"."documents"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "sr"."service_request_document_links" ADD CONSTRAINT "service_request_document_links_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
