CREATE TYPE "com"."contract_status" AS ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'EXPIRED');
--> statement-breakpoint
CREATE TABLE "com"."contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internal_code" text NOT NULL,
	"client_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"contract_number" text NOT NULL,
	"title" text NOT NULL,
	"scope_description" text,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"currency_code" text DEFAULT 'BRL' NOT NULL,
	"payment_terms" text,
	"payment_method" text,
	"commercial_terms" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"client_snapshot" jsonb,
	"status" "com"."contract_status" DEFAULT 'DRAFT' NOT NULL,
	"activated_at" timestamp with time zone,
	"activated_by_identity_id" uuid,
	"closed_at" timestamp with time zone,
	"closed_by_identity_id" uuid,
	"closure_reason" text,
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	"updated_by_identity_id" uuid NOT NULL,
	CONSTRAINT "contracts_internal_code_not_empty_chk" CHECK (length(trim("com"."contracts"."internal_code")) > 0),
	CONSTRAINT "contracts_contract_number_not_empty_chk" CHECK (length(trim("com"."contracts"."contract_number")) > 0),
	CONSTRAINT "contracts_unit_id_not_empty_chk" CHECK (length(trim("com"."contracts"."unit_id")) > 0),
	CONSTRAINT "contracts_title_not_empty_chk" CHECK (length(trim("com"."contracts"."title")) > 0),
	CONSTRAINT "contracts_row_version_positive_chk" CHECK ("com"."contracts"."row_version" >= 1),
	CONSTRAINT "contracts_currency_code_chk" CHECK (length(trim("com"."contracts"."currency_code")) = 3),
	CONSTRAINT "contracts_validity_range_chk" CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_internal_code_uidx" ON "com"."contracts" USING btree ("internal_code");
--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_client_contract_number_active_uidx" ON "com"."contracts" USING btree ("client_id", lower(trim("contract_number"))) WHERE "status" IN ('DRAFT', 'ACTIVE');
--> statement-breakpoint
CREATE INDEX "contracts_client_id_idx" ON "com"."contracts" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX "contracts_unit_id_idx" ON "com"."contracts" USING btree ("unit_id");
--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "com"."contracts" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "com"."contracts" ADD CONSTRAINT "contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "pty"."clients"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."contracts" ADD CONSTRAINT "contracts_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."contracts" ADD CONSTRAINT "contracts_updated_by_identity_id_identities_id_fk" FOREIGN KEY ("updated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."contracts" ADD CONSTRAINT "contracts_activated_by_identity_id_identities_id_fk" FOREIGN KEY ("activated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."contracts" ADD CONSTRAINT "contracts_closed_by_identity_id_identities_id_fk" FOREIGN KEY ("closed_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "com"."contract_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"description" text NOT NULL,
	"service_definition_id" uuid,
	"service_definition_version_id" uuid,
	"service_snapshot" jsonb,
	"quantity" numeric(18, 4),
	"unit_code" text,
	"unit_price_amount" numeric(18, 4),
	"line_total_amount" numeric(18, 4),
	CONSTRAINT "contract_items_line_number_positive_chk" CHECK ("com"."contract_items"."line_number" >= 1),
	CONSTRAINT "contract_items_description_not_empty_chk" CHECK (length(trim("com"."contract_items"."description")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "contract_items_contract_line_uidx" ON "com"."contract_items" USING btree ("contract_id", "line_number");
--> statement-breakpoint
ALTER TABLE "com"."contract_items" ADD CONSTRAINT "contract_items_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "com"."contracts"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."contract_items" ADD CONSTRAINT "contract_items_service_definition_id_service_definitions_id_fk" FOREIGN KEY ("service_definition_id") REFERENCES "cat"."service_definitions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."contract_items" ADD CONSTRAINT "contract_items_service_definition_version_id_service_definition_versions_id_fk" FOREIGN KEY ("service_definition_version_id") REFERENCES "cat"."service_definition_versions"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "com"."contract_document_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"link_purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	CONSTRAINT "contract_document_links_purpose_not_empty_chk" CHECK (length(trim("com"."contract_document_links"."link_purpose")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "contract_document_links_contract_document_purpose_uidx" ON "com"."contract_document_links" USING btree ("contract_id", "document_id", "link_purpose");
--> statement-breakpoint
ALTER TABLE "com"."contract_document_links" ADD CONSTRAINT "contract_document_links_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "com"."contracts"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."contract_document_links" ADD CONSTRAINT "contract_document_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "doc"."documents"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."contract_document_links" ADD CONSTRAINT "contract_document_links_created_by_identity_id_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE "com"."contract_history_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_identity_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "contract_history_events_event_type_not_empty_chk" CHECK (length(trim("com"."contract_history_events"."event_type")) > 0)
);
--> statement-breakpoint
CREATE INDEX "contract_history_events_contract_id_idx" ON "com"."contract_history_events" USING btree ("contract_id");
--> statement-breakpoint
ALTER TABLE "com"."contract_history_events" ADD CONSTRAINT "contract_history_events_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "com"."contracts"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."contract_history_events" ADD CONSTRAINT "contract_history_events_actor_identity_id_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "contract_id" uuid;
--> statement-breakpoint
CREATE INDEX "service_orders_contract_id_idx" ON "so"."service_orders" USING btree ("contract_id");
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "com"."contracts"("id") ON DELETE restrict ON UPDATE cascade;
