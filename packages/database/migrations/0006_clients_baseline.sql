CREATE SCHEMA "pty";
--> statement-breakpoint
CREATE TYPE "pty"."client_status" AS ENUM('ACTIVE', 'INACTIVE');
--> statement-breakpoint
CREATE TYPE "pty"."contact_purpose" AS ENUM('operational', 'commercial', 'billing');
--> statement-breakpoint
CREATE TYPE "pty"."address_purpose" AS ENUM('operational', 'billing', 'correspondence');
--> statement-breakpoint
CREATE TABLE "pty"."clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name" text NOT NULL,
	"trade_name" text,
	"normalized_tax_id" text NOT NULL,
	"external_erp_id" text,
	"status" "pty"."client_status" DEFAULT 'ACTIVE' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"deactivated_by_identity_id" uuid,
	"deactivation_reason" text,
	CONSTRAINT "clients_legal_name_not_empty_chk" CHECK (length(trim("pty"."clients"."legal_name")) > 0),
	CONSTRAINT "clients_normalized_tax_id_digits_chk" CHECK ("pty"."clients"."normalized_tax_id" ~ '^[0-9]{14}$'),
	CONSTRAINT "clients_version_positive_chk" CHECK ("pty"."clients"."version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "clients_normalized_tax_id_uidx" ON "pty"."clients" USING btree ("normalized_tax_id");
--> statement-breakpoint
CREATE INDEX "clients_status_created_at_idx" ON "pty"."clients" USING btree ("status","created_at");
--> statement-breakpoint
CREATE TABLE "pty"."client_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"purpose" "pty"."contact_purpose" NOT NULL,
	"email" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_contacts_name_not_empty_chk" CHECK (length(trim("pty"."client_contacts"."name")) > 0)
);
--> statement-breakpoint
CREATE INDEX "client_contacts_client_id_idx" ON "pty"."client_contacts" USING btree ("client_id");
--> statement-breakpoint
CREATE TABLE "pty"."client_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"purpose" "pty"."address_purpose" NOT NULL,
	"street" text,
	"number" text,
	"complement" text,
	"district" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "client_addresses_client_id_idx" ON "pty"."client_addresses" USING btree ("client_id");
--> statement-breakpoint
ALTER TABLE "pty"."clients" ADD CONSTRAINT "clients_deactivated_by_identity_id_identities_id_fk" FOREIGN KEY ("deactivated_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "pty"."client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "pty"."clients"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "pty"."client_addresses" ADD CONSTRAINT "client_addresses_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "pty"."clients"("id") ON DELETE restrict ON UPDATE cascade;
