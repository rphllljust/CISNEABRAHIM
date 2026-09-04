-- ACCESS ADMINISTRATION (Prompt: ACCESS ADMINISTRATION UI)
-- Registry versionado de roles de acesso e suas capabilities, mais atribuicoes
-- (identity -> role -> escopo) com controle de versao (expectedVersion).
--
-- Interpretacao de engenharia (nao regra empresarial confirmada): a definicao
-- de papéis/capacidades de ACESSO TECNICO e' um artefato de seguranca. O
-- frontend nunca decide autoridade: somente o backend valida catalogos,
-- escopos e segregação. Papéis empresariais (ROLE-CAND docs/09-authorization)
-- permanecem fora deste registro.
--
-- Guards aplicados no servico (nao apenas em banco):
--   * capability deve existir no catalogo servidor (AUTHZ_ACTIONS + SOD + meta);
--   * escopo deve pertencer ao catalogo; escopo ancorado exige scope_ref;
--   * auto-atribuicao (target == actor) e' negada (self-escalation);
--   * acumulo ACCESS_ADMIN + FINANCIAL_APPROVAL na mesma identidade/escopo
--     efetivo viola SOD-007/SOD-012 (CANDIDATE documental) -> negado;
--   * alteracao com expectedVersion obsoleto -> ACCESS_ADMIN_VERSION_CONFLICT;
--   * toda mutacao grava security audit.
-- Concessões (grants) e decisões PDP nao sao alteradas por esta tabela:
-- este registro e' a camada de configuração administravel; ligar estas roles
-- ao enforcement efetivo fica pendente de autorizacao (como prompts recentes).

CREATE TABLE "authorization".access_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ACTIVE',
  version integer NOT NULL DEFAULT 1,
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT access_roles_code_uidx UNIQUE (code),
  CONSTRAINT access_roles_code_chk CHECK (code ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  CONSTRAINT access_roles_label_chk CHECK (length(trim(label)) BETWEEN 1 AND 120),
  CONSTRAINT access_roles_status_chk CHECK (status IN ('ACTIVE', 'INACTIVE')),
  CONSTRAINT access_roles_version_chk CHECK (version >= 1)
);

COMMENT ON TABLE "authorization".access_roles IS
  'Registro administravel de roles de acesso (codigo funcional, nunca nome de pessoa).';

CREATE TABLE "authorization".access_role_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES "authorization".access_roles(id) ON DELETE CASCADE,
  capability text NOT NULL,
  added_by_identity_id uuid NOT NULL REFERENCES identity.identities(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT access_role_capabilities_role_capability_uidx UNIQUE (role_id, capability),
  CONSTRAINT access_role_capabilities_capability_chk CHECK (length(trim(capability)) BETWEEN 3 AND 120)
);

CREATE INDEX access_role_capabilities_capability_idx
  ON "authorization".access_role_capabilities (capability);

COMMENT ON TABLE "authorization".access_role_capabilities IS
  'Capabilities de um role; validadas no servico contra o catalogo servidor.';

CREATE TABLE "authorization".access_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES "authorization".access_roles(id) ON DELETE RESTRICT,
  identity_id uuid NOT NULL REFERENCES identity.identities(id) ON DELETE RESTRICT,
  scope_type "authorization".authz_scope_type NOT NULL,
  scope_anchor text,
  version integer NOT NULL DEFAULT 1,
  assigned_by_identity_id uuid NOT NULL REFERENCES identity.identities(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT NOW(),
  revoked_at timestamptz,
  revoked_by_identity_id uuid REFERENCES identity.identities(id) ON DELETE RESTRICT,
  CONSTRAINT access_role_assignments_anchored_scope_requires_anchor_chk CHECK (
    scope_type NOT IN ('UNIT', 'CLIENT', 'CONTRACT', 'DOCUMENT', 'FINANCIAL')
    OR (scope_anchor IS NOT NULL AND length(trim(scope_anchor)) > 0)
  ),
  CONSTRAINT access_role_assignments_global_no_anchor_chk CHECK (scope_type <> 'GLOBAL' OR scope_anchor IS NULL),
  CONSTRAINT access_role_assignments_revoked_after_assigned_chk CHECK (revoked_at IS NULL OR revoked_at >= assigned_at),
  CONSTRAINT access_role_assignments_version_chk CHECK (version >= 1)
);

CREATE UNIQUE INDEX access_role_assignments_active_uidx
  ON "authorization".access_role_assignments
  (identity_id, role_id, scope_type, COALESCE(scope_anchor, ''))
  WHERE revoked_at IS NULL;

CREATE INDEX access_role_assignments_identity_idx
  ON "authorization".access_role_assignments (identity_id);

CREATE INDEX access_role_assignments_role_idx
  ON "authorization".access_role_assignments (role_id);

COMMENT ON TABLE "authorization".access_role_assignments IS
  'Atribuicao identity -> role -> escopo, versionada e revogavel (append-only logico).';
