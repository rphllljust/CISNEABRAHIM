CREATE TYPE pty.supplier_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE pty.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  trade_name text,
  normalized_tax_id text NOT NULL,
  external_erp_id text,
  payment_terms text,
  currency_code text NOT NULL DEFAULT 'BRL',
  status pty.supplier_status NOT NULL DEFAULT 'ACTIVE',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deactivated_at timestamptz,
  deactivated_by_identity_id uuid REFERENCES identity.identities(id),
  deactivation_reason text,
  CONSTRAINT suppliers_legal_name_chk CHECK (length(trim(legal_name)) > 0),
  CONSTRAINT suppliers_tax_id_chk CHECK (normalized_tax_id ~ '^[0-9]{14}$'),
  CONSTRAINT suppliers_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT suppliers_version_chk CHECK (version >= 1)
);

CREATE UNIQUE INDEX suppliers_normalized_tax_id_uidx ON pty.suppliers (normalized_tax_id);

COMMENT ON TABLE pty.suppliers IS
'Supplier master. Distinct from Client (pty.clients). CNPJ 14 digits per approved PJ rule. CPF/PF is NOT_IN_RELEASE_1.';

CREATE TABLE pty.supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES pty.suppliers(id),
  name text NOT NULL,
  purpose pty.contact_purpose NOT NULL,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT supplier_contacts_name_chk CHECK (length(trim(name)) > 0)
);

CREATE INDEX supplier_contacts_supplier_id_idx ON pty.supplier_contacts (supplier_id);

CREATE TABLE pty.supplier_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES pty.suppliers(id),
  purpose pty.address_purpose NOT NULL,
  street text,
  number text,
  complement text,
  district text,
  city text,
  state text,
  postal_code text,
  country text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX supplier_addresses_supplier_id_idx ON pty.supplier_addresses (supplier_id);

CREATE TABLE pty.supplier_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES pty.suppliers(id),
  event_kind text NOT NULL,
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  payload text,
  CONSTRAINT supplier_history_kind_chk CHECK (event_kind IN ('CREATED', 'UPDATED', 'DEACTIVATED', 'ACTIVATED'))
);

CREATE INDEX supplier_history_supplier_id_idx ON pty.supplier_history_events (supplier_id, occurred_at);

CREATE OR REPLACE VIEW rpt.read_suppliers AS
SELECT * FROM pty.suppliers OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_supplier_contacts AS
SELECT * FROM pty.supplier_contacts OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_supplier_addresses AS
SELECT * FROM pty.supplier_addresses OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_supplier_history_events AS
SELECT * FROM pty.supplier_history_events OFFSET 0;
