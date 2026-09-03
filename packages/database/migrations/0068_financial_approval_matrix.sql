CREATE TYPE "authorization".approval_matrix_status AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

CREATE TYPE "authorization".approval_operation AS ENUM (
  'PURCHASE',
  'PAYMENT',
  'EXPENSE',
  'ADJUSTMENT',
  'REOPEN',
  'BUDGET'
);

CREATE TABLE "authorization".approval_matrices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  currency_code text NOT NULL DEFAULT 'BRL',
  published_version integer,
  draft_version integer NOT NULL DEFAULT 1,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT approval_matrices_code_uidx UNIQUE (code),
  CONSTRAINT approval_matrices_code_chk CHECK (code ~ '^[A-Z][A-Z0-9_-]{1,63}$'),
  CONSTRAINT approval_matrices_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT approval_matrices_version_chk CHECK (version >= 1),
  CONSTRAINT approval_matrices_draft_chk CHECK (draft_version >= 1)
);

CREATE TABLE "authorization".approval_matrix_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matrix_id uuid NOT NULL REFERENCES "authorization".approval_matrices(id),
  version integer NOT NULL,
  status "authorization".approval_matrix_status NOT NULL DEFAULT 'DRAFT',
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  published_by_identity_id uuid REFERENCES identity.identities(id),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT approval_matrix_versions_uidx UNIQUE (matrix_id, version),
  CONSTRAINT approval_matrix_versions_number_chk CHECK (version >= 1)
);

CREATE TABLE "authorization".approval_matrix_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES "authorization".approval_matrix_versions(id),
  operation "authorization".approval_operation NOT NULL,
  role_code text NOT NULL,
  capability text NOT NULL,
  scope_type "authorization".authz_scope_type NOT NULL,
  scope_anchor text,
  amount_limit numeric(18, 4) NOT NULL,
  line_number integer NOT NULL,
  CONSTRAINT approval_matrix_rules_role_chk CHECK (role_code ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  CONSTRAINT approval_matrix_rules_capability_chk CHECK (length(trim(capability)) > 0),
  CONSTRAINT approval_matrix_rules_limit_chk CHECK (amount_limit > 0),
  CONSTRAINT approval_matrix_rules_line_chk CHECK (line_number >= 1),
  CONSTRAINT approval_matrix_rules_line_uidx UNIQUE (version_id, line_number)
);

CREATE TABLE "authorization".approval_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES identity.identities(id),
  role_code text NOT NULL,
  scope_type "authorization".authz_scope_type NOT NULL,
  scope_anchor text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT approval_role_assignments_role_chk CHECK (role_code ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  CONSTRAINT approval_role_assignments_version_chk CHECK (version >= 1)
);

CREATE UNIQUE INDEX approval_role_assignments_uidx
  ON "authorization".approval_role_assignments (
    identity_id,
    role_code,
    scope_type,
    COALESCE(scope_anchor, '')
  );

CREATE UNIQUE INDEX approval_matrix_versions_one_published_uidx
  ON "authorization".approval_matrix_versions (matrix_id)
  WHERE status = 'PUBLISHED';

COMMENT ON TABLE "authorization".approval_matrices IS
'Versioned financial approval matrix. Rules bind role, capability, scope and monetary limit — never person names.';

CREATE OR REPLACE VIEW rpt.read_approval_matrices AS
SELECT * FROM "authorization".approval_matrices OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_approval_matrix_rules AS
SELECT * FROM "authorization".approval_matrix_rules OFFSET 0;
