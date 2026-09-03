CREATE OR REPLACE VIEW "rpt"."read_clients" AS
SELECT * FROM "pty"."clients" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_client_addresses" AS
SELECT * FROM "pty"."client_addresses" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_proposals" AS
SELECT * FROM "com"."proposals" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_proposal_versions" AS
SELECT * FROM "com"."proposal_versions" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_purchase_orders" AS
SELECT * FROM "com"."purchase_orders" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_service_definitions" AS
SELECT * FROM "cat"."service_definitions" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_service_definition_versions" AS
SELECT * FROM "cat"."service_definition_versions" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_service_requests" AS
SELECT * FROM "sr"."service_requests" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_service_orders" AS
SELECT * FROM "so"."service_orders" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_planned_resources" AS
SELECT * FROM "so"."planned_resources" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_execution_entries" AS
SELECT * FROM "so"."execution_entries" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_execution_evidence" AS
SELECT * FROM "so"."execution_evidence" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_operational_cost_entries" AS
SELECT * FROM "so"."operational_cost_entries" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_resource_allocations" AS
SELECT * FROM "res"."resource_allocations" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_physical_assets" AS
SELECT * FROM "ast"."physical_assets" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_vehicle_profiles" AS
SELECT * FROM "ast"."vehicle_profiles" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_measurements" AS
SELECT * FROM "msr"."measurements" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_measurement_items" AS
SELECT * FROM "msr"."measurement_items" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_billing_records" AS
SELECT * FROM "bil"."billing_records" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_billing_documents" AS
SELECT * FROM "bil"."billing_documents" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_documents" AS
SELECT * FROM "doc"."documents" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_document_versions" AS
SELECT * FROM "doc"."document_versions" OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW "rpt"."read_stored_objects" AS
SELECT * FROM "doc"."stored_objects" OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW "rpt"."read_service_orders" IS
'Read-only cross-context application contract. Domain writes remain owned by OPERATIONS.';
--> statement-breakpoint
COMMENT ON VIEW "rpt"."read_purchase_orders" IS
'Read-only cross-context application contract. Domain writes remain owned by COMMERCIAL.';
--> statement-breakpoint
COMMENT ON VIEW "rpt"."read_documents" IS
'Read-only cross-context application contract. Domain writes remain owned by DOCUMENTS.';
