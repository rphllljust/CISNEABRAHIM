CREATE TYPE fin.collection_case_status AS ENUM ('OPEN', 'CLOSED');

CREATE TYPE fin.collection_action_kind AS ENUM (
  'CONTACT',
  'NOTICE',
  'PROMISE_TO_PAY',
  'RENEGOTIATION'
);

CREATE TYPE fin.collection_promise_status AS ENUM ('OPEN', 'KEPT', 'BROKEN');

CREATE TABLE fin.receivable_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id uuid NOT NULL REFERENCES fin.receivables(id),
  unit_id text NOT NULL,
  client_id uuid NOT NULL,
  status fin.collection_case_status NOT NULL DEFAULT 'OPEN',
  opened_because_overdue boolean NOT NULL DEFAULT true,
  promised_due_date date,
  version integer NOT NULL DEFAULT 1,
  opened_at timestamptz NOT NULL DEFAULT NOW(),
  closed_at timestamptz,
  opened_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  closed_by_identity_id uuid REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT receivable_collections_unit_chk CHECK (length(trim(unit_id)) > 0),
  CONSTRAINT receivable_collections_version_chk CHECK (version >= 1)
);

CREATE UNIQUE INDEX receivable_collections_one_open_uidx
  ON fin.receivable_collections (receivable_id)
  WHERE status = 'OPEN';

CREATE TABLE fin.collection_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES fin.receivable_collections(id),
  kind fin.collection_action_kind NOT NULL,
  notes text,
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  idempotency_key text NOT NULL,
  CONSTRAINT collection_actions_idempotency_uidx UNIQUE (collection_id, idempotency_key)
);

CREATE TABLE fin.collection_promises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES fin.receivable_collections(id),
  action_id uuid NOT NULL REFERENCES fin.collection_actions(id),
  promised_amount numeric(18, 4) NOT NULL,
  promised_on date NOT NULL,
  status fin.collection_promise_status NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  resolved_at timestamptz,
  CONSTRAINT collection_promises_amount_chk CHECK (promised_amount > 0)
);

CREATE TABLE fin.collection_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES fin.receivable_collections(id),
  event_kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT collection_history_event_chk CHECK (length(trim(event_kind)) > 0)
);

CREATE OR REPLACE FUNCTION fin.forbid_collection_history_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'collection_history is append-only';
END;
$$;

CREATE TRIGGER collection_history_no_update_trg
  BEFORE UPDATE ON fin.collection_history
  FOR EACH ROW EXECUTE FUNCTION fin.forbid_collection_history_mutation();

CREATE TRIGGER collection_history_no_delete_trg
  BEFORE DELETE ON fin.collection_history
  FOR EACH ROW EXECUTE FUNCTION fin.forbid_collection_history_mutation();

COMMENT ON TABLE fin.receivable_collections IS
'Collection case over a receivable. Does not mutate receivable principal or due_date. Aging remains derived.';

CREATE OR REPLACE VIEW rpt.read_receivable_collections AS
SELECT * FROM fin.receivable_collections OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_collection_actions AS
SELECT * FROM fin.collection_actions OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_collection_promises AS
SELECT * FROM fin.collection_promises OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_collection_history AS
SELECT * FROM fin.collection_history OFFSET 0;
