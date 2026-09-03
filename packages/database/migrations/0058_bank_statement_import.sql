CREATE TYPE fin.bank_import_format AS ENUM (
  'CISNE_STATEMENT_V1',
  'OFX',
  'CNAB',
  'UNKNOWN'
);

CREATE TYPE fin.bank_import_status AS ENUM (
  'UPLOADED',
  'VALIDATED',
  'PARSED',
  'NORMALIZED',
  'IMPORTED',
  'REJECTED'
);

CREATE TYPE fin.bank_line_identity_kind AS ENUM (
  'SUFFICIENT',
  'FILE_LOCAL'
);

ALTER TABLE fin.bank_statements
  ADD COLUMN file_checksum text;

ALTER TABLE fin.bank_statement_lines
  ADD COLUMN fingerprint text,
  ADD COLUMN identity_kind fin.bank_line_identity_kind NOT NULL DEFAULT 'FILE_LOCAL';

CREATE UNIQUE INDEX bank_statements_unit_account_file_checksum_uidx
  ON fin.bank_statements (unit_id, financial_account_id, file_checksum)
  WHERE file_checksum IS NOT NULL;

CREATE UNIQUE INDEX bank_statement_lines_fingerprint_uidx
  ON fin.bank_statement_lines (fingerprint)
  WHERE fingerprint IS NOT NULL AND identity_kind = 'SUFFICIENT';

CREATE TABLE fin.bank_statement_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  financial_account_id uuid NOT NULL REFERENCES fin.financial_accounts(id),
  bank_statement_id uuid REFERENCES fin.bank_statements(id),
  format fin.bank_import_format NOT NULL,
  file_name text NOT NULL,
  file_checksum text NOT NULL,
  byte_size integer NOT NULL,
  status fin.bank_import_status NOT NULL,
  rejection_code text,
  line_count integer NOT NULL DEFAULT 0,
  imported_line_count integer NOT NULL DEFAULT 0,
  duplicate_line_count integer NOT NULL DEFAULT 0,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT bank_statement_imports_file_name_chk CHECK (length(trim(file_name)) > 0),
  CONSTRAINT bank_statement_imports_checksum_chk CHECK (length(trim(file_checksum)) = 64),
  CONSTRAINT bank_statement_imports_byte_size_chk CHECK (byte_size >= 0),
  CONSTRAINT bank_statement_imports_idempotency_chk CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT bank_statement_imports_imported_statement_chk CHECK (
    (status = 'IMPORTED' AND bank_statement_id IS NOT NULL)
    OR (status <> 'IMPORTED')
  )
);

CREATE UNIQUE INDEX bank_statement_imports_unit_account_checksum_imported_uidx
  ON fin.bank_statement_imports (unit_id, financial_account_id, file_checksum)
  WHERE status = 'IMPORTED';

CREATE UNIQUE INDEX bank_statement_imports_unit_idempotency_uidx
  ON fin.bank_statement_imports (unit_id, idempotency_key);

COMMENT ON TABLE fin.bank_statement_imports IS
'Bank file import batch. OFX/CNAB remain LAYOUT_NOT_DOCUMENTED. CISNE_STATEMENT_V1 is the documented authorized fixture. No ERP dependency.';

CREATE OR REPLACE VIEW rpt.read_bank_statements AS
SELECT * FROM fin.bank_statements OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_bank_statement_lines AS
SELECT * FROM fin.bank_statement_lines OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_bank_statement_imports AS
SELECT * FROM fin.bank_statement_imports OFFSET 0;
