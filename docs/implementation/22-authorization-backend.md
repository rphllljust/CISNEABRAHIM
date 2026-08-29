# Prompt 22 — Autorização backend deny-by-default

Motor técnico de autorização (PDP/PEP) sem papéis empresariais inventados.

## Arquitetura

```text
Request
  → JwtAuthGuard (AuthN)
  → AuthorizationGuard (PEP)
      → PolicyDecisionPointService (PDP)
          → authorization.grants (PostgreSQL)
  → Handler
```

| Componente | Responsabilidade |
|------------|------------------|
| **PEP** | `AuthorizationGuard` + `@RequireAuthz` — enforcement em rotas |
| **PDP** | `PolicyDecisionPointService` — decisão `ALLOW`/`DENY` |
| **Persistência** | `authorization.grants`, `authorization.decision_audits` |
| **Admin técnico** | `GrantAdminService` — concessão/revogação auditável |

## Vocabulário tipado (técnico)

### Actions

| Action | Uso |
|--------|-----|
| `authz:probe:execute` | Endpoint de prova (testes/E2E) |
| `authz:grant:create` | Criar concessão |
| `authz:grant:revoke` | Revogar concessão |
| `authz:grant:list` | Reservado |
| `platform:diagnostics:read` | Infra técnica (AUTHZ-028) — sem escopo financeiro |

### Resource types

| Resource | Uso |
|----------|-----|
| `authz:probe` | Recurso de prova |
| `authz:grant` | Meta-administração de concessões |
| `platform:system` | Infraestrutura técnica |

### Scopes

| Scope | Semântica |
|-------|-----------|
| `GLOBAL` | Concessão ampla no tipo de recurso |
| `OWN` | Restrito ao próprio ator/recurso |
| `PLATFORM` | Somente recursos `platform:*` / técnico |

**Papéis empresariais (ROLE-CAND):** `0` — não implementados; concessões explícitas por identidade.

## Rotas protegidas

| Método | Rota | AuthN | AuthZ |
|--------|------|-------|-------|
| `GET` | `/api/v1/authz/probe` | Bearer | `authz:probe:execute` |
| `POST` | `/api/v1/authz/grants` | Bearer | `authz:grant:create` |
| `POST` | `/api/v1/authz/grants/:id/revoke` | Bearer | `authz:grant:revoke` |

Rotas de autenticação (`/auth/*`) permanecem somente AuthN (Prompt 20).

## Persistência (`authorization` schema)

### `authorization.grants`

| Campo | Descrição |
|-------|-----------|
| `identity_id` | Beneficiário |
| `action` / `resource_type` / `resource_id` | Alvo tipado |
| `scope_type` | GLOBAL / OWN / PLATFORM |
| `constraints` | JSONB versionável |
| `granted_by_identity_id` | Ator concedente |
| `version` | Versão da concessão |
| `valid_from` / `valid_until` | Validade |
| `revoked_at` / `revoked_by_identity_id` | Revogação |

### `authorization.decision_audits`

Registro de decisões ALLOW/DENY com `reason_code` seguro (sem vazar recurso).

## Negação (fail-closed)

| HTTP | Código | Mensagem |
|------|--------|----------|
| 401 | `AUTHZ_UNAUTHENTICATED` | Authentication required. |
| 403 | `AUTHZ_DENIED` | Access denied. |

Motivos internos (`NO_ACTIVE_GRANT`, `SCOPE_MISMATCH`, etc.) ficam em `decision_audits`, não na resposta HTTP.

## Isolamento admin técnico

Grants com `scope_type = PLATFORM` só podem apontar para recursos técnicos (`platform:system`, `authz:*`). **Não** concede escopo financeiro/operacional automaticamente (SOD-012 / ACT-010).

## Migration

`packages/database/migrations/0002_authorization_baseline.sql`

## Testes

| Arquivo | Cobertura |
|---------|-----------|
| `policy-decision-point.service.spec.ts` | deny default, sem grant, allow |
| `authorization.integration.spec.ts` | PG real: ação/recurso errado, expirado, revogado, concorrência |
| `authorization.e2e.spec.ts` | anônimo, autenticado sem grant, rota direta, allow com grant |

```bash
pnpm db:migrate
npx pnpm@9.15.9 test
npx pnpm@9.15.9 test:integration
npx pnpm@9.15.9 test:e2e
```

## Fora de escopo

- Matriz CMD × ROLE-CAND empresarial
- Autorização contextual de OS/faturamento
- Prompt 23 não executado
