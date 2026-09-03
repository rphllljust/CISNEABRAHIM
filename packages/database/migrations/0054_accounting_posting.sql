CREATE TYPE acc.posting_rule_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE acc.posting_rule_version_status AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TYPE acc.posting_origin_kind AS ENUM (
  'FINANCE',
  'FISCAL',
  'INVENTORY',
  'PAYROLL'
);

CREATE TYPE acc.posting_event_kind AS ENUM (
  'RECEIVABLE_RECOGNIZED',
  'SETTLEMENT_CONFIRMED',
  'PAYABLE_RECOGNIZED',
  'PAYMENT_CONFIRMED',
  'FISCAL_DOCUMENT_AUTHORIZED',
  'INVENTORY_MOVEMENT_POSTED',
  'PAYROLL_CLOSED'
);

CREATE TYPE acc.posting_request_status AS ENUM ('PENDING', 'POSTED', 'REJECTED');

CREATE TABLE acc.accounting_posting_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  origin_kind acc.posting_origin_kind NOT NULL,
  event_kind acc.posting_event_kind NOT NULL,
  status acc.posting_rule_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT posting_rules_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT posting_rules_name_chk CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX posting_rules_unit_code_uidx
  ON acc.accounting_posting_rules (unit_id, code);
CREATE UNIQUE INDEX posting_rules_unit_origin_event_active_uidx
  ON acc.accounting_posting_rules (unit_id, origin_kind, event_kind)
  WHERE status = 'ACTIVE';

CREATE TABLE acc.accounting_posting_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_rule_id uuid NOT NULL REFERENCES acc.accounting_posting_rules(id),
  version_number integer NOT NULL,
  status acc.posting_rule_version_status NOT NULL DEFAULT 'DRAFT',
  debit_account_id uuid NOT NULL REFERENCES acc.accounting_accounts(id),
  credit_account_id uuid NOT NULL REFERENCES acc.accounting_accounts(id),
  required_context jsonb NOT NULL DEFAULT '["amount","occurredOn","currencyCode"]'::jsonb,
  effective_from date NOT NULL,
  effective_to date,
  source_reference text NOT NULL,
  row_version integer NOT NULL DEFAULT 1,
  published_at timestamptz,
  published_by_identity_id uuid REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT posting_rule_versions_number_chk CHECK (version_number >= 1),
  CONSTRAINT posting_rule_versions_accounts_chk CHECK (debit_account_id <> credit_account_id),
  CONSTRAINT posting_rule_versions_source_chk CHECK (length(trim(source_reference)) > 0),
  CONSTRAINT posting_rule_versions_range_chk CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT posting_rule_versions_row_version_chk CHECK (row_version >= 1),
  CONSTRAINT posting_rule_versions_published_chk CHECK (
    (status = 'DRAFT' AND published_at IS NULL AND published_by_identity_id IS NULL)
    OR (status = 'PUBLISHED' AND published_at IS NOT NULL AND published_by_identity_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX posting_rule_versions_number_uidx
  ON acc.accounting_posting_rule_versions (posting_rule_id, version_number);
CREATE INDEX posting_rule_versions_rule_id_idx
  ON acc.accounting_posting_rule_versions (posting_rule_id);

CREATE TABLE acc.accounting_posting_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  origin_kind acc.posting_origin_kind NOT NULL,
  event_kind acc.posting_event_kind NOT NULL,
  source_id uuid NOT NULL,
  source_reference text NOT NULL,
  idempotency_key text NOT NULL,
  posting_rule_id uuid NOT NULL REFERENCES acc.accounting_posting_rules(id),
  posting_rule_version_id uuid NOT NULL REFERENCES acc.accounting_posting_rule_versions(id),
  journal_entry_id uuid REFERENCES acc.journal_entries(id),
  status acc.posting_request_status NOT NULL DEFAULT 'PENDING',
  amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  occurred_on date NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT posting_requests_amount_chk CHECK (amount > 0),
  CONSTRAINT posting_requests_currency_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT posting_requests_source_chk CHECK (length(trim(source_reference)) > 0),
  CONSTRAINT posting_requests_idempotency_chk CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT posting_requests_posted_journal_chk CHECK (
    (status = 'POSTED' AND journal_entry_id IS NOT NULL)
    OR (status <> 'POSTED')
  )
);

CREATE UNIQUE INDEX posting_requests_event_source_uidx
  ON acc.accounting_posting_requests (origin_kind, event_kind, source_id);
CREATE UNIQUE INDEX posting_requests_unit_idempotency_uidx
  ON acc.accounting_posting_requests (unit_id, idempotency_key);

CREATE OR REPLACE FUNCTION acc.forbid_published_posting_rule_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'PUBLISHED' THEN
      RAISE EXCEPTION 'ACCOUNTING_RULE_VERSION_IMMUTABLE' USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'PUBLISHED' THEN
    RAISE EXCEPTION 'ACCOUNTING_RULE_VERSION_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER posting_rule_versions_published_immutable_trg
BEFORE UPDATE OR DELETE ON acc.accounting_posting_rule_versions
FOR EACH ROW
EXECUTE FUNCTION acc.forbid_published_posting_rule_version_mutation();
