CREATE TYPE acc.period_close_run_status AS ENUM ('SUCCEEDED', 'BLOCKED');

CREATE TYPE acc.period_close_check_kind AS ENUM (
  'RECEIVABLES',
  'PAYABLES',
  'TREASURY',
  'BANK_RECONCILIATION',
  'FISCAL',
  'ACCOUNTING',
  'DEBIT_CREDIT',
  'PENDING_POSTING',
  'DUPLICATE_ECONOMIC_EVENT',
  'ORIGIN_CONSISTENCY'
);

CREATE TYPE acc.period_close_check_result AS ENUM ('PASS', 'FAIL', 'INFORMATIONAL');

CREATE TABLE acc.period_close_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  chart_id uuid NOT NULL REFERENCES acc.charts_of_accounts(id),
  require_trial_balance_balanced boolean NOT NULL DEFAULT TRUE,
  require_no_draft_journals boolean NOT NULL DEFAULT TRUE,
  require_no_critical_pending_postings boolean NOT NULL DEFAULT TRUE,
  require_no_duplicate_economic_events boolean NOT NULL DEFAULT TRUE,
  require_origin_consistency boolean NOT NULL DEFAULT TRUE,
  require_bank_reconciliation_integrity boolean NOT NULL DEFAULT TRUE,
  require_receivables_settled boolean NOT NULL DEFAULT FALSE,
  require_payables_settled boolean NOT NULL DEFAULT FALSE,
  require_all_bank_lines_matched boolean NOT NULL DEFAULT FALSE,
  require_fiscal_documents_authorized boolean NOT NULL DEFAULT FALSE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id)
);

CREATE UNIQUE INDEX period_close_policies_unit_chart_uidx
  ON acc.period_close_policies (unit_id, chart_id);

COMMENT ON TABLE acc.period_close_policies IS
'Configured period-close blockers. Settlement of receivables/payables is optional and off by default.';

CREATE TABLE acc.period_close_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES acc.accounting_periods(id),
  policy_id uuid NOT NULL REFERENCES acc.period_close_policies(id),
  status acc.period_close_run_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id)
);

CREATE INDEX period_close_runs_period_id_idx ON acc.period_close_runs (period_id);

CREATE TABLE acc.period_close_check_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  close_run_id uuid NOT NULL REFERENCES acc.period_close_runs(id) ON DELETE CASCADE,
  kind acc.period_close_check_kind NOT NULL,
  result acc.period_close_check_result NOT NULL,
  blocking boolean NOT NULL,
  observed_count integer NOT NULL DEFAULT 0,
  detail text NOT NULL,
  CONSTRAINT period_close_check_results_count_chk CHECK (observed_count >= 0),
  CONSTRAINT period_close_check_results_detail_chk CHECK (length(trim(detail)) > 0)
);

CREATE UNIQUE INDEX period_close_check_results_run_kind_uidx
  ON acc.period_close_check_results (close_run_id, kind);

CREATE OR REPLACE VIEW rpt.read_period_close_policies AS
SELECT * FROM acc.period_close_policies OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_period_close_runs AS
SELECT * FROM acc.period_close_runs OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_period_close_check_results AS
SELECT * FROM acc.period_close_check_results OFFSET 0;
