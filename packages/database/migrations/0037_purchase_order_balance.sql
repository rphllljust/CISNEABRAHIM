CREATE TYPE "com"."purchase_order_consumption_entry_type" AS ENUM('BILLING_PREPARE', 'BILLING_VOID');
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders"
  ADD COLUMN "consumed_amount" numeric(18, 4) DEFAULT '0.0000' NOT NULL;
--> statement-breakpoint
ALTER TABLE "com"."purchase_orders"
  ADD CONSTRAINT "purchase_orders_consumed_amount_non_negative_chk"
  CHECK ("consumed_amount" >= 0);
--> statement-breakpoint
CREATE TABLE "com"."purchase_order_consumption_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"billing_record_id" uuid NOT NULL,
	"entry_type" "com"."purchase_order_consumption_entry_type" NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"currency_code" text DEFAULT 'BRL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_identity_id" uuid NOT NULL,
	CONSTRAINT "purchase_order_consumption_entries_amount_positive_chk" CHECK ("amount" > 0),
	CONSTRAINT "purchase_order_consumption_entries_currency_code_chk" CHECK (length(trim("currency_code")) = 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_order_consumption_entries_po_billing_type_uidx"
  ON "com"."purchase_order_consumption_entries" USING btree ("purchase_order_id", "billing_record_id", "entry_type");
--> statement-breakpoint
CREATE INDEX "purchase_order_consumption_entries_billing_record_id_idx"
  ON "com"."purchase_order_consumption_entries" USING btree ("billing_record_id");
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_consumption_entries"
  ADD CONSTRAINT "purchase_order_consumption_entries_purchase_order_id_purchase_orders_id_fk"
  FOREIGN KEY ("purchase_order_id") REFERENCES "com"."purchase_orders"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_consumption_entries"
  ADD CONSTRAINT "purchase_order_consumption_entries_billing_record_id_billing_records_id_fk"
  FOREIGN KEY ("billing_record_id") REFERENCES "bil"."billing_records"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "com"."purchase_order_consumption_entries"
  ADD CONSTRAINT "purchase_order_consumption_entries_created_by_identity_id_identities_id_fk"
  FOREIGN KEY ("created_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
