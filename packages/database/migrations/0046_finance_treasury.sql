CREATE TYPE fin.financial_account_kind AS ENUM ('BANK', 'CASH');

CREATE TYPE fin.financial_account_lifecycle AS ENUM ('ACTIVE', 'CLOSED');

CREATE TYPE fin.financial_direction AS ENUM ('CREDIT', 'DEBIT');

CREATE TYPE fin.financial_transaction_status AS ENUM ('POSTED');

CREATE TYPE fin.treasury_transfer_kind AS ENUM ('TRANSFER', 'REVERSAL');

CREATE TYPE fin.treasury_origin_kind AS ENUM (
  'OPENING_BALANCE',
  'MANUAL_AUTHORIZED',
  'PAYABLE_PAYMENT',
  'RECEIVABLE_SETTLEMENT',
  'TRANSFER',
  'REVERSAL'
);

CREATE TABLE fin.financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  kind fin.financial_account_kind NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  currency_code text NOT NULL,
  overdraft_allowed boolean NOT NULL DEFAULT FALSE,
  lifecycle fin.financial_account_lifecycle NOT NULL DEFAULT 'ACTIVE',
  closed_at timestamptz,
  closed_by_identity_id uuid REFERENCES identity.identities(id),
  close_reason text,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT financial_accounts_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT financial_accounts_name_chk CHECK (length(trim(name)) > 0),
  CONSTRAINT financial_accounts_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT financial_accounts_row_version_positive_chk CHECK (row_version >= 1),
  CONSTRAINT financial_accounts_closed_consistency_chk CHECK (
    (lifecycle = 'ACTIVE' AND closed_at IS NULL AND close_reason IS NULL)
    OR (lifecycle = 'CLOSED' AND closed_at IS NOT NULL AND close_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX financial_accounts_unit_code_uidx ON fin.financial_accounts (unit_id, code);
CREATE INDEX financial_accounts_unit_id_idx ON fin.financial_accounts (unit_id);

CREATE TABLE fin.bank_accounts (
  financial_account_id uuid PRIMARY KEY REFERENCES fin.financial_accounts(id) ON DELETE CASCADE,
  bank_code text NOT NULL,
  agency text NOT NULL,
  account_number text NOT NULL,
  CONSTRAINT bank_accounts_bank_code_chk CHECK (length(trim(bank_code)) > 0),
  CONSTRAINT bank_accounts_agency_chk CHECK (length(trim(agency)) > 0),
  CONSTRAINT bank_accounts_account_number_chk CHECK (length(trim(account_number)) > 0)
);

CREATE TABLE fin.cash_accounts (
  financial_account_id uuid PRIMARY KEY REFERENCES fin.financial_accounts(id) ON DELETE CASCADE,
  location_code text NOT NULL,
  CONSTRAINT cash_accounts_location_code_chk CHECK (length(trim(location_code)) > 0)
);

CREATE TABLE fin.treasury_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id uuid NOT NULL REFERENCES fin.financial_accounts(id),
  to_account_id uuid NOT NULL REFERENCES fin.financial_accounts(id),
  kind fin.treasury_transfer_kind NOT NULL DEFAULT 'TRANSFER',
  amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  occurred_at timestamptz NOT NULL,
  idempotency_key text NOT NULL,
  reference text NOT NULL,
  origin_kind fin.treasury_origin_kind NOT NULL,
  origin_id uuid NOT NULL,
  origin_reference text NOT NULL,
  reverses_transfer_id uuid REFERENCES fin.treasury_transfers(id),
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT treasury_transfers_amount_positive_chk CHECK (amount > 0),
  CONSTRAINT treasury_transfers_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT treasury_transfers_idempotency_key_chk CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT treasury_transfers_reference_chk CHECK (length(trim(reference)) > 0),
  CONSTRAINT treasury_transfers_origin_reference_chk CHECK (length(trim(origin_reference)) > 0),
  CONSTRAINT treasury_transfers_distinct_accounts_chk CHECK (from_account_id <> to_account_id),
  CONSTRAINT treasury_transfers_reversal_consistency_chk CHECK (
    (kind = 'TRANSFER' AND reverses_transfer_id IS NULL)
    OR (kind = 'REVERSAL' AND reverses_transfer_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX treasury_transfers_from_idempotency_uidx
  ON fin.treasury_transfers (from_account_id, idempotency_key);
CREATE INDEX treasury_transfers_to_account_id_idx ON fin.treasury_transfers (to_account_id);

CREATE TABLE fin.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES fin.financial_accounts(id),
  direction fin.financial_direction NOT NULL,
  amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  occurred_at timestamptz NOT NULL,
  status fin.financial_transaction_status NOT NULL DEFAULT 'POSTED',
  idempotency_key text NOT NULL,
  reference text NOT NULL,
  origin_kind fin.treasury_origin_kind NOT NULL,
  origin_id uuid NOT NULL,
  origin_reference text NOT NULL,
  transfer_id uuid REFERENCES fin.treasury_transfers(id),
  reverses_transaction_id uuid REFERENCES fin.financial_transactions(id),
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT financial_transactions_amount_positive_chk CHECK (amount > 0),
  CONSTRAINT financial_transactions_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT financial_transactions_idempotency_key_chk CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT financial_transactions_reference_chk CHECK (length(trim(reference)) > 0),
  CONSTRAINT financial_transactions_origin_reference_chk CHECK (length(trim(origin_reference)) > 0),
  CONSTRAINT financial_transactions_reversal_consistency_chk CHECK (
    (origin_kind <> 'REVERSAL' AND reverses_transaction_id IS NULL)
    OR (origin_kind = 'REVERSAL' AND reverses_transaction_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX financial_transactions_account_idempotency_uidx
  ON fin.financial_transactions (account_id, idempotency_key);
CREATE INDEX financial_transactions_account_id_idx ON fin.financial_transactions (account_id);
CREATE INDEX financial_transactions_transfer_id_idx ON fin.financial_transactions (transfer_id);

CREATE OR REPLACE VIEW rpt.read_financial_accounts AS
SELECT * FROM fin.financial_accounts OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_bank_accounts AS
SELECT * FROM fin.bank_accounts OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_cash_accounts AS
SELECT * FROM fin.cash_accounts OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_treasury_transfers AS
SELECT * FROM fin.treasury_transfers OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_financial_transactions AS
SELECT * FROM fin.financial_transactions OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW rpt.read_financial_transactions IS
'Read-only treasury ledger. Balance is derived from POSTED CREDIT minus DEBIT. Confirmed movements are immutable; correction is a reversal row. Not an ACCOUNTING ledger entry.';