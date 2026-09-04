CREATE TYPE pty.purchase_order_requirement AS ENUM (
  'NOT_REQUIRED',
  'BEFORE_EXECUTION',
  'BEFORE_BILLING'
);

ALTER TABLE pty.clients
  ADD COLUMN purchase_order_requirement pty.purchase_order_requirement
    NOT NULL DEFAULT 'NOT_REQUIRED';

CREATE TYPE cat.billing_entitlement_policy AS ENUM (
  'MEASUREMENT_APPROVED',
  'FIXED_PRICE',
  'PERIODIC',
  'MILESTONE'
);

ALTER TABLE cat.service_definition_versions
  ADD COLUMN billing_entitlement_policy cat.billing_entitlement_policy
    NOT NULL DEFAULT 'MEASUREMENT_APPROVED';

ALTER TABLE so.service_orders
  ADD COLUMN status_before_cancel so.service_order_status,
  ADD COLUMN reopened_at timestamptz,
  ADD COLUMN reopened_by_identity_id uuid REFERENCES identity.identities(id) ON DELETE RESTRICT,
  ADD COLUMN reopen_reason text,
  ADD COLUMN status_before_reopen so.service_order_status;

ALTER TABLE so.service_orders
  ADD CONSTRAINT service_orders_reopen_reason_chk
  CHECK (reopened_at IS NULL OR length(trim(reopen_reason)) > 0);

DROP INDEX IF EXISTS so.service_orders_service_request_id_uidx;

ALTER TABLE com.purchase_orders
  ADD COLUMN authorized_overrun_amount numeric(18, 4) NOT NULL DEFAULT 0,
  ADD COLUMN overrun_justification text,
  ADD COLUMN overrun_authorized_at timestamptz,
  ADD COLUMN overrun_authorized_by_identity_id uuid REFERENCES identity.identities(id) ON DELETE RESTRICT;

ALTER TABLE com.purchase_orders
  ADD CONSTRAINT purchase_orders_overrun_amount_non_negative_chk
  CHECK (authorized_overrun_amount >= 0);

ALTER TABLE com.purchase_orders
  ADD CONSTRAINT purchase_orders_overrun_justification_chk
  CHECK (
    authorized_overrun_amount = 0
    OR length(trim(overrun_justification)) > 0
  );

ALTER TABLE bil.billing_records
  ALTER COLUMN measurement_id DROP NOT NULL;

ALTER TABLE bil.billing_items
  ALTER COLUMN measurement_item_id DROP NOT NULL;

ALTER TABLE bil.billing_records
  ADD COLUMN entitlement_policy text NOT NULL DEFAULT 'MEASUREMENT_APPROVED';

CREATE UNIQUE INDEX billing_records_service_order_prepared_uidx
  ON bil.billing_records (service_order_id)
  WHERE status = 'PREPARED';

CREATE OR REPLACE VIEW rpt.read_clients AS
SELECT * FROM pty.clients OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_service_orders AS
SELECT * FROM so.service_orders OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_purchase_orders AS
SELECT * FROM com.purchase_orders OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_service_definition_versions AS
SELECT * FROM cat.service_definition_versions OFFSET 0;
