-- RECURRING RENTAL BILLING (Prompt: Recurring Rental Billing)
-- BillingSchedule de contratos/locações recorrentes + ledger de competência.
-- O mesmo período (schedule + competência) nunca gera duas cobranças
-- (unique + engine; replay devolve a instrução armazenada). Cobrança histórica
-- guarda snapshot imutável do contrato; cancelamento só bloqueia competências
-- futuras. Nenhum valor/regra fiscal ou comercial é inventado aqui.

CREATE TYPE bil.recurring_billing_schedule_status AS ENUM ('ACTIVE', 'CANCELLED');

CREATE TYPE bil.recurring_billing_subject_kind AS ENUM ('CONTRACT', 'RENTAL');

CREATE TABLE bil.recurring_billing_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_number text NOT NULL,
  unit_id text NOT NULL,
  subject_kind bil.recurring_billing_subject_kind NOT NULL,
  subject_contract_id uuid REFERENCES com.contracts(id) ON DELETE RESTRICT,
  subject_service_order_id uuid REFERENCES so.service_orders(id) ON DELETE RESTRICT,
  status bil.recurring_billing_schedule_status NOT NULL DEFAULT 'ACTIVE',
  periodicity text NOT NULL DEFAULT 'MONTHLY',
  first_competence_on date NOT NULL,
  last_competence_on date,
  cancelled_from_competence_on date,
  monthly_amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL DEFAULT 'BRL',
  contract_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT recurring_billing_schedules_number_uidx UNIQUE (schedule_number),
  CONSTRAINT recurring_billing_schedules_subject_one_chk CHECK (
    (subject_contract_id IS NOT NULL)::int + (subject_service_order_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT recurring_billing_schedules_validity_chk CHECK (
    last_competence_on IS NULL OR last_competence_on >= first_competence_on
  ),
  CONSTRAINT recurring_billing_schedules_periodicity_chk CHECK (periodicity = 'MONTHLY'),
  CONSTRAINT recurring_billing_schedules_amount_chk CHECK (monthly_amount > 0),
  CONSTRAINT recurring_billing_schedules_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT recurring_billing_schedules_unit_chk CHECK (length(trim(unit_id)) > 0)
);

CREATE INDEX recurring_billing_schedules_subject_idx
  ON bil.recurring_billing_schedules (subject_kind, subject_contract_id, subject_service_order_id);

CREATE TABLE bil.recurring_billing_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES bil.recurring_billing_schedules(id) ON DELETE RESTRICT,
  competence_on date NOT NULL,
  period_key text NOT NULL,
  status text NOT NULL DEFAULT 'GENERATED',
  instruction jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  generated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT recurring_billing_periods_schedule_competence_uidx UNIQUE (schedule_id, competence_on),
  CONSTRAINT recurring_billing_periods_period_key_uidx UNIQUE (schedule_id, period_key),
  CONSTRAINT recurring_billing_periods_period_key_chk CHECK (period_key ~ '^\d{4}-\d{2}$')
);

CREATE INDEX recurring_billing_periods_competence_idx
  ON bil.recurring_billing_periods (competence_on);

CREATE OR REPLACE VIEW rpt.read_recurring_billing_schedules AS
SELECT * FROM bil.recurring_billing_schedules OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_recurring_billing_periods AS
SELECT * FROM bil.recurring_billing_periods OFFSET 0;

COMMENT ON TABLE bil.recurring_billing_schedules IS
'BillingSchedule — agenda mensal de cobrança de contrato/locação recorrente (sem valores inventados).';

COMMENT ON TABLE bil.recurring_billing_periods IS
'Ledger de competências faturadas — unique (schedule, competência) garante DUPLICATE PERIOD BILLING 0.';
