CREATE SCHEMA IF NOT EXISTS fis;

CREATE TYPE fis.fiscal_document_status AS ENUM (
  'DRAFT',
  'READY',
  'SUBMITTED',
  'AUTHORIZED',
  'REJECTED',
  'CANCELLED'
);

CREATE TYPE fis.fiscal_party_role AS ENUM ('ISSUER', 'RECIPIENT');

CREATE TYPE fis.fiscal_source_kind AS ENUM (
  'BILLING_DOCUMENT',
  'MANUAL',
  'RECEIVABLE',
  'OTHER'
);

CREATE TYPE fis.fiscal_event_type AS ENUM (
  'DRAFTED',
  'READIED',
  'UNREADIED',
  'SUBMITTED',
  'AUTHORIZED',
  'REJECTED',
  'TIMED_OUT',
  'RECOVERED',
  'REVISED',
  'CANCELLED'
);

CREATE TYPE fis.fiscal_authorization_outcome AS ENUM (
  'PENDING',
  'AUTHORIZED',
  'REJECTED',
  'TIMEOUT'
);

CREATE TABLE fis.fiscal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  status fis.fiscal_document_status NOT NULL DEFAULT 'DRAFT',
  source_kind fis.fiscal_source_kind NOT NULL,
  source_id uuid,
  billing_document_id uuid,
  description text NOT NULL,
  currency_code text NOT NULL,
  issued_on date NOT NULL,
  certificate_ref text,
  idempotency_key text NOT NULL,
  row_version integer NOT NULL DEFAULT 1,
  submitted_at timestamptz,
  authorized_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT fiscal_documents_description_chk CHECK (length(trim(description)) > 0),
  CONSTRAINT fiscal_documents_currency_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT fiscal_documents_idempotency_chk CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT fiscal_documents_row_version_chk CHECK (row_version >= 1),
  CONSTRAINT fiscal_documents_authorized_consistency_chk CHECK (
    (status <> 'AUTHORIZED' AND status <> 'CANCELLED')
    OR authorized_at IS NOT NULL
  ),
  CONSTRAINT fiscal_documents_cancelled_consistency_chk CHECK (
    (status <> 'CANCELLED')
    OR (cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX fiscal_documents_unit_idempotency_uidx
  ON fis.fiscal_documents (unit_id, idempotency_key);
CREATE UNIQUE INDEX fiscal_documents_source_idempotency_uidx
  ON fis.fiscal_documents (source_kind, source_id, idempotency_key)
  WHERE source_id IS NOT NULL;
CREATE INDEX fiscal_documents_unit_id_idx ON fis.fiscal_documents (unit_id);
CREATE INDEX fiscal_documents_billing_document_id_idx
  ON fis.fiscal_documents (billing_document_id)
  WHERE billing_document_id IS NOT NULL;

CREATE TABLE fis.fiscal_document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_document_id uuid NOT NULL REFERENCES fis.fiscal_documents(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  description text NOT NULL,
  quantity numeric(18, 4) NOT NULL,
  unit_amount numeric(18, 4) NOT NULL,
  line_amount numeric(18, 4) NOT NULL,
  item_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT fiscal_document_items_line_chk CHECK (line_number >= 1),
  CONSTRAINT fiscal_document_items_description_chk CHECK (length(trim(description)) > 0),
  CONSTRAINT fiscal_document_items_quantity_chk CHECK (quantity > 0),
  CONSTRAINT fiscal_document_items_unit_amount_chk CHECK (unit_amount > 0),
  CONSTRAINT fiscal_document_items_line_amount_chk CHECK (line_amount > 0)
);

CREATE UNIQUE INDEX fiscal_document_items_line_uidx
  ON fis.fiscal_document_items (fiscal_document_id, line_number);

CREATE TABLE fis.fiscal_party_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_document_id uuid NOT NULL REFERENCES fis.fiscal_documents(id) ON DELETE CASCADE,
  role fis.fiscal_party_role NOT NULL,
  legal_name text NOT NULL,
  tax_identifier text NOT NULL,
  party_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT fiscal_party_snapshots_name_chk CHECK (length(trim(legal_name)) > 0),
  CONSTRAINT fiscal_party_snapshots_tax_chk CHECK (length(trim(tax_identifier)) > 0)
);

CREATE UNIQUE INDEX fiscal_party_snapshots_role_uidx
  ON fis.fiscal_party_snapshots (fiscal_document_id, role);

CREATE TABLE fis.fiscal_tax_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_document_id uuid NOT NULL REFERENCES fis.fiscal_documents(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  component_label text NOT NULL,
  amount numeric(18, 4) NOT NULL,
  detail_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT fiscal_tax_details_line_chk CHECK (line_number >= 1),
  CONSTRAINT fiscal_tax_details_label_chk CHECK (length(trim(component_label)) > 0),
  CONSTRAINT fiscal_tax_details_amount_chk CHECK (amount > 0)
);

CREATE UNIQUE INDEX fiscal_tax_details_line_uidx
  ON fis.fiscal_tax_details (fiscal_document_id, line_number);

CREATE TABLE fis.fiscal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_document_id uuid NOT NULL REFERENCES fis.fiscal_documents(id) ON DELETE CASCADE,
  event_type fis.fiscal_event_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id)
);

CREATE INDEX fiscal_events_document_id_idx ON fis.fiscal_events (fiscal_document_id);

CREATE TABLE fis.fiscal_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_document_id uuid NOT NULL REFERENCES fis.fiscal_documents(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  gateway_id text NOT NULL,
  outcome fis.fiscal_authorization_outcome NOT NULL,
  protocol_code text,
  message text,
  request_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz,
  CONSTRAINT fiscal_authorizations_attempt_chk CHECK (attempt_number >= 1),
  CONSTRAINT fiscal_authorizations_gateway_chk CHECK (length(trim(gateway_id)) > 0)
);

CREATE UNIQUE INDEX fiscal_authorizations_attempt_uidx
  ON fis.fiscal_authorizations (fiscal_document_id, attempt_number);

CREATE OR REPLACE VIEW rpt.read_fiscal_documents AS
SELECT * FROM fis.fiscal_documents OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_fiscal_document_items AS
SELECT * FROM fis.fiscal_document_items OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_fiscal_party_snapshots AS
SELECT * FROM fis.fiscal_party_snapshots OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_fiscal_tax_details AS
SELECT * FROM fis.fiscal_tax_details OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_fiscal_events AS
SELECT * FROM fis.fiscal_events OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_fiscal_authorizations AS
SELECT * FROM fis.fiscal_authorizations OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW rpt.read_fiscal_documents IS
'Official FiscalDocument read contract. Not a BillingDocument. CISNE is SoT; external gateway only authorizes/transmits. No stored tax engine.';
--> statement-breakpoint
CREATE OR REPLACE FUNCTION fis.forbid_authorized_document_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('AUTHORIZED', 'CANCELLED') THEN
      RAISE EXCEPTION 'FISCAL_DOCUMENT_IMMUTABLE' USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'FISCAL_DOCUMENT_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD.status = 'AUTHORIZED' THEN
    IF NEW.status = 'CANCELLED'
       AND NEW.description = OLD.description
       AND NEW.currency_code = OLD.currency_code
       AND NEW.issued_on = OLD.issued_on
       AND NEW.source_kind = OLD.source_kind
       AND NEW.source_id IS NOT DISTINCT FROM OLD.source_id
       AND NEW.billing_document_id IS NOT DISTINCT FROM OLD.billing_document_id
       AND NEW.idempotency_key = OLD.idempotency_key
    THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'FISCAL_DOCUMENT_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER fiscal_documents_authorized_immutable_trg
BEFORE UPDATE OR DELETE ON fis.fiscal_documents
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_authorized_document_mutation();

CREATE OR REPLACE FUNCTION fis.forbid_authorized_child_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  document_status fis.fiscal_document_status;
  document_id uuid;
BEGIN
  document_id := COALESCE(NEW.fiscal_document_id, OLD.fiscal_document_id);
  SELECT status INTO document_status FROM fis.fiscal_documents WHERE id = document_id;
  IF document_status IN ('AUTHORIZED', 'CANCELLED') THEN
    RAISE EXCEPTION 'FISCAL_DOCUMENT_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER fiscal_document_items_immutable_trg
BEFORE INSERT OR UPDATE OR DELETE ON fis.fiscal_document_items
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_authorized_child_mutation();

CREATE TRIGGER fiscal_party_snapshots_immutable_trg
BEFORE INSERT OR UPDATE OR DELETE ON fis.fiscal_party_snapshots
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_authorized_child_mutation();

CREATE TRIGGER fiscal_tax_details_immutable_trg
BEFORE INSERT OR UPDATE OR DELETE ON fis.fiscal_tax_details
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_authorized_child_mutation();

CREATE OR REPLACE FUNCTION fis.forbid_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'FISCAL_EVENT_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER fiscal_events_immutable_trg
BEFORE UPDATE OR DELETE ON fis.fiscal_events
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_event_mutation();

CREATE OR REPLACE FUNCTION fis.forbid_authorization_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'FISCAL_AUTHORIZATION_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER fiscal_authorizations_immutable_trg
BEFORE UPDATE OR DELETE ON fis.fiscal_authorizations
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_authorization_mutation();