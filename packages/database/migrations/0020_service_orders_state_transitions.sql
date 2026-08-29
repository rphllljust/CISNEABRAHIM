ALTER TABLE "so"."service_orders" ADD COLUMN "prepared_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "prepared_by_identity_id" uuid;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "released_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "released_by_identity_id" uuid;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "cancelled_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "cancelled_by_identity_id" uuid;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD COLUMN "cancellation_reason" text;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_prepared_by_identity_id_identities_id_fk" FOREIGN KEY ("prepared_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_released_by_identity_id_identities_id_fk" FOREIGN KEY ("released_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_cancelled_by_identity_id_identities_id_fk" FOREIGN KEY ("cancelled_by_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_cancellation_reason_when_cancelled_chk" CHECK (
	"status" <> 'CANCELLED'::"so"."service_order_status"
	OR ("cancellation_reason" IS NOT NULL AND length(trim("cancellation_reason")) > 0)
);
--> statement-breakpoint
ALTER TABLE "so"."service_orders" ADD CONSTRAINT "service_orders_released_at_when_released_chk" CHECK (
	"status" <> 'RELEASED'::"so"."service_order_status"
	OR "released_at" IS NOT NULL
);
