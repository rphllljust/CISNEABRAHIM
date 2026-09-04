-- LEGAL ESTABLISHMENT MASTER (Prompt: Legal Establishment Master)
-- Cadastro da própria empresa emissora (matriz e estabelecimentos) com
-- inscrições fiscais CNPJ/IE/IM, endereço fiscal, regime, status,
-- certificados/referências fiscais e histórico append-only.
-- Interpretação de engenharia: entidade master de partido próprio registrada
-- no schema pty (party), sem dados empresariais da Cisne hardcoded.

CREATE TYPE pty.legal_entity_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE pty.establishment_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE pty.tax_registration_kind AS ENUM ('CNPJ', 'IE', 'IM');

CREATE TYPE pty.tax_registration_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE pty.tax_regime AS ENUM (
  'SIMPLES_NACIONAL',
  'MEI',
  'LUCRO_PRESUMIDO',
  'LUCRO_REAL'
);

CREATE TYPE pty.certificate_kind AS ENUM ('A1', 'A3');

CREATE TYPE pty.certificate_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE pty.legal_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  trade_name text,
  status pty.legal_entity_status NOT NULL DEFAULT 'ACTIVE',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deactivated_at timestamptz,
  deactivated_by_identity_id uuid REFERENCES identity.identities(id),
  deactivation_reason text,
  CONSTRAINT legal_entities_legal_name_not_empty_chk CHECK (length(trim(legal_name)) > 0),
  CONSTRAINT legal_entities_version_positive_chk CHECK (version >= 1)
);

CREATE TABLE pty.establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_entity_id uuid NOT NULL REFERENCES pty.legal_entities(id),
  code text NOT NULL,
  trade_name text,
  status pty.establishment_status NOT NULL DEFAULT 'ACTIVE',
  is_default_issuer boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  -- Endereço fiscal
  street text,
  number text,
  complement text,
  district text,
  city text,
  state text,
  postal_code text,
  country text NOT NULL DEFAULT 'BR',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deactivated_at timestamptz,
  deactivated_by_identity_id uuid REFERENCES identity.identities(id),
  deactivation_reason text,
  CONSTRAINT establishments_legal_entity_code_uidx UNIQUE (legal_entity_id, code),
  CONSTRAINT establishments_code_not_empty_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT establishments_version_positive_chk CHECK (version >= 1),
  CONSTRAINT establishments_postal_digits_chk CHECK (
    postal_code IS NULL OR postal_code ~ '^[0-9]{8}$'
  )
);

-- No máximo um estabelecimento emissor default por entidade legal.
CREATE UNIQUE INDEX establishments_default_issuer_per_entity_uidx
  ON pty.establishments (legal_entity_id)
  WHERE is_default_issuer;

CREATE TABLE pty.establishment_tax_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES pty.establishments(id),
  tax_kind pty.tax_registration_kind NOT NULL,
  normalized_number text NOT NULL,
  state text,
  regime pty.tax_regime,
  status pty.tax_registration_status NOT NULL DEFAULT 'ACTIVE',
  valid_from date,
  valid_to date,
  authority text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deactivated_at timestamptz,
  deactivated_by_identity_id uuid REFERENCES identity.identities(id),
  deactivation_reason text,
  CONSTRAINT tax_registrations_number_not_empty_chk CHECK (length(trim(normalized_number)) > 0),
  CONSTRAINT tax_registrations_version_positive_chk CHECK (version >= 1),
  -- CNPJ: apenas dígitos, 14 posições.
  CONSTRAINT tax_registrations_cnpj_digits_chk CHECK (
    tax_kind <> 'CNPJ' OR normalized_number ~ '^[0-9]{14}$'
  ),
  -- IE: alfanumérica (alguns estados usam letras); normalizada maiúscula.
  CONSTRAINT tax_registrations_ie_format_chk CHECK (
    tax_kind <> 'IE' OR normalized_number ~ '^[A-Z0-9]+$'
  ),
  -- IM: dígitos.
  CONSTRAINT tax_registrations_im_digits_chk CHECK (
    tax_kind <> 'IM' OR normalized_number ~ '^[0-9]+$'
  )
);

-- Duplicidade de CNPJ da própria empresa é vedada (mesmo número não pode ser
-- registrado por mais de um estabelecimento).
CREATE UNIQUE INDEX establishment_tax_registrations_cnpj_uidx
  ON pty.establishment_tax_registrations (normalized_number)
  WHERE tax_kind = 'CNPJ';

-- IE duplicada na mesma UF também é vedada.
CREATE UNIQUE INDEX establishment_tax_registrations_ie_state_uidx
  ON pty.establishment_tax_registrations (state, normalized_number)
  WHERE tax_kind = 'IE';

-- IM (municipal) não se repete dentro do mesmo estabelecimento.
CREATE UNIQUE INDEX establishment_tax_registrations_im_establishment_uidx
  ON pty.establishment_tax_registrations (establishment_id, normalized_number)
  WHERE tax_kind = 'IM';

CREATE TABLE pty.establishment_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES pty.establishments(id),
  certificate_kind pty.certificate_kind NOT NULL,
  label text NOT NULL,
  subject_ref text,
  issuer_ref text,
  valid_from date,
  valid_to date,
  status pty.certificate_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT establishment_certificates_label_not_empty_chk CHECK (length(trim(label)) > 0)
);

-- Histórico append-only (padrão suppliers).
CREATE TABLE pty.legal_entity_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_entity_id uuid NOT NULL REFERENCES pty.legal_entities(id),
  event_kind text NOT NULL,
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  payload text
);

CREATE TABLE pty.establishment_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES pty.establishments(id),
  event_kind text NOT NULL,
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  payload text
);

CREATE TABLE pty.establishment_tax_registration_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_registration_id uuid NOT NULL REFERENCES pty.establishment_tax_registrations(id),
  event_kind text NOT NULL,
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  payload text
);

-- FiscalDocument passa a referenciar o estabelecimento emissor (FK opcional
-- para não quebrar documentos já registrados; a emissão nova exige o vínculo).
ALTER TABLE fis.fiscal_documents
  ADD COLUMN establishment_id uuid;

ALTER TABLE fis.fiscal_documents
  ADD CONSTRAINT fiscal_documents_establishment_fk
    FOREIGN KEY (establishment_id) REFERENCES pty.establishments(id);

CREATE INDEX fiscal_documents_establishment_id_idx
  ON fis.fiscal_documents (establishment_id);

CREATE OR REPLACE VIEW rpt.read_legal_entities AS
SELECT * FROM pty.legal_entities OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_establishments AS
SELECT * FROM pty.establishments OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_establishment_tax_registrations AS
SELECT * FROM pty.establishment_tax_registrations OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_establishment_certificates AS
SELECT * FROM pty.establishment_certificates OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_legal_entity_history_events AS
SELECT * FROM pty.legal_entity_history_events OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_establishment_history_events AS
SELECT * FROM pty.establishment_history_events OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_establishment_tax_registration_history_events AS
SELECT * FROM pty.establishment_tax_registration_history_events OFFSET 0;

COMMENT ON TABLE pty.legal_entities IS
'LegalEntity — pessoa jurídica da própria empresa (master, sem dados hardcoded no código).';

COMMENT ON TABLE pty.establishments IS
'Establishment — estabelecimento emissor (matriz/filial) com endereço fiscal e status; FiscalDocument referencia o emissor.';

COMMENT ON TABLE pty.establishment_tax_registrations IS
'TaxRegistration — CNPJ/IE/IM do estabelecimento, com regime, vigência e status.';
