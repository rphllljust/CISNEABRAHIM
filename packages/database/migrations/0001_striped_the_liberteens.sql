CREATE SCHEMA "identity";
--> statement-breakpoint
CREATE TYPE "identity"."identity_status" AS ENUM('active', 'disabled', 'locked');--> statement-breakpoint
CREATE TYPE "identity"."session_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TABLE "identity"."credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"login_identifier_normalized" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "credentials_login_identifier_normalized_uq" UNIQUE("login_identifier_normalized"),
	CONSTRAINT "credentials_identity_id_uq" UNIQUE("identity_id"),
	CONSTRAINT "credentials_password_hash_not_empty_chk" CHECK (length(trim("identity"."credentials"."password_hash")) >= 60),
	CONSTRAINT "credentials_revoked_at_after_created_chk" CHECK ("identity"."credentials"."revoked_at" IS NULL OR "identity"."credentials"."revoked_at" >= "identity"."credentials"."created_at")
);
--> statement-breakpoint
CREATE TABLE "identity"."identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "identity"."identity_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone,
	CONSTRAINT "identities_disabled_at_consistency_chk" CHECK (("identity"."identities"."status" = 'active' AND "identity"."identities"."disabled_at" IS NULL) OR ("identity"."identities"."status" <> 'active' AND "identity"."identities"."disabled_at" IS NOT NULL)),
	CONSTRAINT "identities_version_positive_chk" CHECK ("identity"."identities"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "identity"."refresh_token_families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"identity_id" uuid NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_token_families_session_id_uq" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "identity"."refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"replaced_by_token_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_uq" UNIQUE("token_hash"),
	CONSTRAINT "refresh_tokens_token_hash_not_empty_chk" CHECK (length(trim("identity"."refresh_tokens"."token_hash")) >= 64),
	CONSTRAINT "refresh_tokens_expires_after_created_chk" CHECK ("identity"."refresh_tokens"."expires_at" > "identity"."refresh_tokens"."created_at"),
	CONSTRAINT "refresh_tokens_revoked_at_after_created_chk" CHECK ("identity"."refresh_tokens"."revoked_at" IS NULL OR "identity"."refresh_tokens"."revoked_at" >= "identity"."refresh_tokens"."created_at")
);
--> statement-breakpoint
CREATE TABLE "identity"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"status" "identity"."session_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	CONSTRAINT "sessions_version_positive_chk" CHECK ("identity"."sessions"."version" >= 1),
	CONSTRAINT "sessions_expires_after_created_chk" CHECK ("identity"."sessions"."expires_at" > "identity"."sessions"."created_at"),
	CONSTRAINT "sessions_revoked_consistency_chk" CHECK (("identity"."sessions"."status" = 'revoked' AND "identity"."sessions"."revoked_at" IS NOT NULL) OR ("identity"."sessions"."status" <> 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "identity"."credentials" ADD CONSTRAINT "credentials_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "identity"."refresh_token_families" ADD CONSTRAINT "refresh_token_families_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "identity"."sessions"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "identity"."refresh_token_families" ADD CONSTRAINT "refresh_token_families_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "identity"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_family_id_refresh_token_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "identity"."refresh_token_families"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "identity"."sessions" ADD CONSTRAINT "sessions_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "identity"."identities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "credentials_identity_id_idx" ON "identity"."credentials" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "refresh_token_families_identity_id_idx" ON "identity"."refresh_token_families" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_family_id_idx" ON "identity"."refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "identity"."refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_identity_id_idx" ON "identity"."sessions" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "identity"."sessions" USING btree ("expires_at");