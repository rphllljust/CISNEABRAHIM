CREATE TYPE "com"."purchase_order_status" AS ENUM('DRAFT', 'REGISTERED', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "com"."purchase_order_pricing_structure" AS ENUM('LINE_ITEMS', 'HEADER_TOTAL');
--> statement-breakpoint
CREATE TYPE "com"."purchase_order_rule_type" AS ENUM(
	'PO_NUMBER_REQUIRED_ON_INVOICE',
	'XML_REQUIRED',
	'PDF_REQUIRED',
	'BILLING_CUTOFF',
	'RECIPIENT'
);
--> statement-breakpoint
CREATE TABLE "com"."purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internal_code" text NOT NULL,
	"client_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"po_number" text NOT NULL,
	"rc_number" text,
	"issue_date" date,
	"buyer_contact" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"service_manager" text,
	"delivery_location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"billing_location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"currency_code" text DEFAULT 'BRL' NOT NULL,
	"pricing_structure" "com"."purchase_order_pricing_structure" NOT NULL,
	"total_amount" numeric(18, 4),
	"payment_terms" text,
	"payment_method" text,
	"client_snapshot" jsonb,
	"original_document_id" uuid,
	"status" "com"."purchase_order_status" DEFAULT 'DRAFT' NOT NULL,
	"registered_at" timestamp with time zone,
	"registered_by_identity_id" uuid,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_identity_id" uuid,
	"cancellation_reason" text,
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "purchase_orders_internal_code_not_empty_chk" CHECK (length(trim("com"."purchase_orders"."internal_code")) > 0),
	CONSTRAINT "purchase_orders_po_number_not_empty_chk" CHECK (length(trim("com"."purchase_orders"."po_number")) > 0),
	CONSTRAINT "purchase_orders_unit_id_not_empty_chk" CHECK (length(trim("com"."purchase_orders"."unit_id")) > 0),
	CONSTRAINT "purchase_orders_row_version_positive_chk" CHECK ("com"."purchase_orders"."row_version" >= 1),
	CONSTRAINT "purchase_orders_currency_code_chk" CHECK (length(trim("com"."purchase_orders"."currency_code")) = 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_orders_internal_code_uidx" ON "com"."purchase_orders" USING btree ("internal_code");
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_orders_client_po_number_active_uidx" ON "com"."purchase_orders" USING btree ("client_id", lower(trim("po_number"))) WHERE "status" IN ('DRAFT', 'REGISTERED');
--> statement-breakpoint
CREATE INDEX "purchase_orders_client_id_idx" ON "com"."purchase_orders" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX "purchase_orders_unit_id_idx" ON "com"."purchase_orders" USING btree ("unit_id");
--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "com"."purchase_orders" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders" ADD CONSTRAINT "purchase_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "pty"."clients"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders" ADD CONSTRAINT "purchase_orders_original_document_id_documents_id_fk" FOREIGN KEY ("original_document_id") REFERENCES "doc"."documents"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders" ADD CONSTRAINT "purchase_orders_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders" ADD CONSTRAINT "purchase_orders_registered_by_identity_id_identities_id_fk" FOREIGN KEY ("registered_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders" ADD CONSTRAINT "purchase_orders_cancelled_by_identity_id_identities_id_fk" FOREIGN KEY ("cancelled_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "com"."purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"description" text NOT NULL,
	"service_definition_id" uuid,
	"service_definition_version_id" uuid,
	"service_snapshot" jsonb,
	"quantity" numeric(18, 4),
	"unit_code" text,
	"unit_price_amount" numeric(18, 4),
	"line_total_amount" numeric(18, 4),
	"rc_line_reference" text,
	CONSTRAINT "purchase_order_items_line_number_positive_chk" CHECK ("com"."purchase_order_items"."line_number" >= 1),
	CONSTRAINT "purchase_order_items_description_not_empty_chk" CHECK (length(trim("com"."purchase_order_items"."description")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_order_items_order_line_uidx" ON "com"."purchase_order_items" USING btree ("purchase_order_id", "line_number");
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "com"."purchase_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_service_definition_id_service_definitions_id_fk" FOREIGN KEY ("service_definition_id") REFERENCES "cat"."service_definitions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "com"."purchase_order_billing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"rule_type" "com"."purchase_order_rule_type" NOT NULL,
	"rule_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"precedence_tier" text DEFAULT 'PURCHASE_ORDER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	CONSTRAINT "purchase_order_billing_rules_precedence_tier_chk" CHECK (length(trim("com"."purchase_order_billing_rules"."precedence_tier")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_order_billing_rules_order_type_uidx" ON "com"."purchase_order_billing_rules" USING btree ("purchase_order_id", "rule_type");
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_billing_rules" ADD CONSTRAINT "purchase_order_billing_rules_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "com"."purchase_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_billing_rules" ADD CONSTRAINT "purchase_order_billing_rules_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "com"."purchase_order_document_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"link_purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	CONSTRAINT "purchase_order_document_links_purpose_not_empty_chk" CHECK (length(trim("com"."purchase_order_document_links"."link_purpose")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_order_document_links_order_document_purpose_uidx" ON "com"."purchase_order_document_links" USING btree ("purchase_order_id", "document_id", "link_purpose");
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_document_links" ADD CONSTRAINT "purchase_order_document_links_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "com"."purchase_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_document_links" ADD CONSTRAINT "purchase_order_document_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "doc"."documents"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_document_links" ADD CONSTRAINT "purchase_order_document_links_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
