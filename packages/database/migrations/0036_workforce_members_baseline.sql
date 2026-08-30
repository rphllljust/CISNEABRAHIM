CREATE SCHEMA IF NOT EXISTS wrk;
--> statement-breakpoint
CREATE TYPE wrk.workforce_member_status AS ENUM('ACTIVE', 'INACTIVE');
--> statement-breakpoint
CREATE SEQUENCE wrk.workforce_member_code_seq START WITH 1 INCREMENT BY 1 NO MAXVALUE;
--> statement-breakpoint
CREATE TABLE wrk.workforce_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code text NOT NULL,
  legal_name text NOT NULL,
  preferred_name text,
  default_labor_type_code text,
  external_erp_id text,
  status wrk.workforce_member_status NOT NULL DEFAULT 'ACTIVE',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deactivated_at timestamptz,
  deactivated_by_identity_id uuid,
  deactivation_reason text,
  CONSTRAINT workforce_members_legal_name_not_empty_chk CHECK (length(trim(legal_name)) > 0),
  CONSTRAINT workforce_members_member_code_not_empty_chk CHECK (length(trim(member_code)) > 0),
  CONSTRAINT workforce_members_version_positive_chk CHECK (version >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX workforce_members_member_code_uidx ON wrk.workforce_members (member_code);
--> statement-breakpoint
CREATE UNIQUE INDEX workforce_members_external_erp_id_uidx ON wrk.workforce_members (external_erp_id) WHERE external_erp_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX workforce_members_status_created_at_idx ON wrk.workforce_members (status, created_at);
--> statement-breakpoint
CREATE INDEX workforce_members_default_labor_type_code_idx ON wrk.workforce_members (default_labor_type_code);
--> statement-breakpoint
ALTER TABLE wrk.workforce_members ADD CONSTRAINT workforce_members_default_labor_type_code_fk FOREIGN KEY (default_labor_type_code) REFERENCES cat.operational_labor_types(code) ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE wrk.workforce_members ADD CONSTRAINT workforce_members_deactivated_by_identity_id_fk FOREIGN KEY (deactivated_by_identity_id) REFERENCES identity.identities(id) ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
CREATE TABLE wrk.workforce_member_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workforce_member_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_identity_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX workforce_member_history_events_member_id_idx ON wrk.workforce_member_history_events (workforce_member_id, occurred_at DESC);
--> statement-breakpoint
ALTER TABLE wrk.workforce_member_history_events ADD CONSTRAINT workforce_member_history_events_member_id_fk FOREIGN KEY (workforce_member_id) REFERENCES wrk.workforce_members(id) ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE wrk.workforce_member_history_events ADD CONSTRAINT workforce_member_history_events_actor_identity_id_fk FOREIGN KEY (actor_identity_id) REFERENCES identity.identities(id) ON DELETE restrict ON UPDATE cascade;
