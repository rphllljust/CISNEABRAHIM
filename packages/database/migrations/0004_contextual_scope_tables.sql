CREATE TABLE "authorization"."scope_refs" (
	"scope_type" "authorization"."authz_scope_type" NOT NULL,
	"ref_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scope_refs_pkey" PRIMARY KEY("scope_type","ref_id"),
	CONSTRAINT "scope_refs_anchor_scope_chk" CHECK ("authorization"."scope_refs"."scope_type" IN ('UNIT', 'CLIENT', 'CONTRACT', 'DOCUMENT', 'FINANCIAL')),
	CONSTRAINT "scope_refs_ref_id_not_empty_chk" CHECK (length(trim("authorization"."scope_refs"."ref_id")) > 0)
);
--> statement-breakpoint
CREATE TABLE "authorization"."scoped_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_identity_id" uuid NOT NULL,
	"assigned_identity_id" uuid,
	"unit_id" text NOT NULL,
	"client_id" text NOT NULL,
	"contract_id" text NOT NULL,
	"document_id" text NOT NULL,
	"is_financial" boolean DEFAULT false NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scoped_records_unit_id_not_empty_chk" CHECK (length(trim("authorization"."scoped_records"."unit_id")) > 0),
	CONSTRAINT "scoped_records_client_id_not_empty_chk" CHECK (length(trim("authorization"."scoped_records"."client_id")) > 0),
	CONSTRAINT "scoped_records_contract_id_not_empty_chk" CHECK (length(trim("authorization"."scoped_records"."contract_id")) > 0),
	CONSTRAINT "scoped_records_document_id_not_empty_chk" CHECK (length(trim("authorization"."scoped_records"."document_id")) > 0)
);
--> statement-breakpoint
ALTER TABLE "authorization"."scoped_records" ADD CONSTRAINT "scoped_records_owner_identity_id_identities_id_fk" FOREIGN KEY ("owner_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "authorization"."scoped_records" ADD CONSTRAINT "scoped_records_assigned_identity_id_identities_id_fk" FOREIGN KEY ("assigned_identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "scoped_records_unit_id_idx" ON "authorization"."scoped_records" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "scoped_records_client_id_idx" ON "authorization"."scoped_records" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "scoped_records_contract_id_idx" ON "authorization"."scoped_records" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "scoped_records_document_id_idx" ON "authorization"."scoped_records" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "scoped_records_assigned_identity_id_idx" ON "authorization"."scoped_records" USING btree ("assigned_identity_id");--> statement-breakpoint
CREATE INDEX "scoped_records_owner_identity_id_idx" ON "authorization"."scoped_records" USING btree ("owner_identity_id");--> statement-breakpoint
ALTER TABLE "authorization"."grants" ADD CONSTRAINT "grants_global_no_resource_chk" CHECK ("authorization"."grants"."scope_type" <> 'GLOBAL' OR "authorization"."grants"."resource_id" IS NULL);--> statement-breakpoint
ALTER TABLE "authorization"."grants" ADD CONSTRAINT "grants_anchored_scope_requires_ref_chk" CHECK ("authorization"."grants"."scope_type" NOT IN ('UNIT', 'CLIENT', 'CONTRACT', 'DOCUMENT', 'FINANCIAL') OR ("authorization"."grants"."resource_id" IS NOT NULL AND length(trim("authorization"."grants"."resource_id")) > 0));--> statement-breakpoint
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY identity_id, action, resource_type, scope_type, COALESCE(resource_id, '')
           ORDER BY created_at
         ) AS rn
  FROM "authorization"."grants"
  WHERE revoked_at IS NULL
)
UPDATE "authorization"."grants" g
SET revoked_at = NOW(),
    version = g.version + 1,
    updated_at = NOW()
FROM ranked r
WHERE g.id = r.id
  AND r.rn > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "grants_active_scope_unique_idx" ON "authorization"."grants" USING btree ("identity_id","action","resource_type","scope_type",COALESCE("resource_id", ''::text)) WHERE "authorization"."grants"."revoked_at" IS NULL;
