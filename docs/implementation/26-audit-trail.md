# Prompt 26 — Audit trail seguro

Fundação de **SECURITY_AUDIT** separada de histórico de domínio e logs técnicos.

## Separação de canais

| Canal | Status neste prompt | Persistência |
|-------|---------------------|--------------|
| `AUDIT_TRAIL` | Documentado — não implementado | — |
| `DOMAIN_HISTORY` | Documentado — não implementado | — |
| `SECURITY_AUDIT` | **Implementado** | `audit.security_audit_events` |
| `TECHNICAL_LOG` | Documentado — não implementado | stdout / futuro |

`authorization.decision_audits` permanece como trilha técnica do PDP; negações sensíveis também são espelhadas em `SECURITY_AUDIT`.

## Eventos auditados

| Evento | Ação | Origem |
|--------|------|--------|
| Login sucesso | `security:auth:login` | `AuthService` |
| Falha de login relevante | `security:auth:login_failure` | credencial inválida, rate limit |
| Logout | `security:auth:logout` | `AuthService` |
| Logout-all | `security:auth:logout_all` | `AuthService` |
| Refresh reuse / revogação | `security:auth:refresh_reuse` | `AuthService.refresh` |
| Concessão de acesso | `security:authz:grant_create` | `GrantAdminService` |
| Revogação de acesso | `security:authz:grant_revoke` | `GrantAdminService` |
| Ação sensível negada | `security:authz:denied` | `PolicyDecisionPointService` (DENY) |
| Bootstrap da API | `security:app:bootstrap` | `AuditBootstrapService` |

**Não registrado:** senha, token, hash, payload sensível.

## Registro (`audit.security_audit_events`)

| Campo | Descrição |
|-------|-----------|
| `id` | UUID |
| `occurred_at` | UTC timestamptz |
| `actor_identity_id` / `actor_session_id` | Ator mínimo |
| `action` | Ação tipada |
| `resource_type` / `resource_id` | Recurso avaliado |
| `outcome` | `SUCCESS` \| `FAILURE` \| `DENIED` |
| `scope_type` | Escopo em concessões |
| `correlation_id` | Até 64 chars (`X-Correlation-Id`) |
| `reason_code` | Código interno sanitizado |
| `classification` | `SECURITY_CRITICAL` \| `SECURITY_STANDARD` |
| `metadata` | JSON redigido e limitado |

Persistência **append-oriented**: trigger PostgreSQL bloqueia `UPDATE`/`DELETE`. **Sem** alegação de imutabilidade criptográfica (hash chain / WORM).

## Segurança

| Controle | Implementação |
|----------|----------------|
| Redaction | `audit-redaction.service.ts` — chaves proibidas, limite 4KB |
| Log injection | `sanitizeAuditText` remove controles |
| Acesso restrito | `GET /api/v1/audit/security-events` exige `platform:diagnostics:read` |
| Falha de auditoria | `SecurityAuditService` — critical loga erro; operação não expõe segredo |
| PII mínimo | Sem login em texto; apenas IDs |

## Rotas técnicas

| Método | Rota | Proteção |
|--------|------|----------|
| GET | `/api/v1/audit/security-events` | JWT + AuthZ platform diagnostics |

## Testes

| Arquivo | Cobertura |
|---------|-----------|
| `audit-redaction.service.spec.ts` | redaction, injection |
| `security-audit.integration.spec.ts` | criação, negação, append-only, concorrência, correlação, sem segredo |
| `security-audit.e2e.spec.ts` | acesso indevido, login auditado |

```bash
npx pnpm@9.15.9 lint
npx pnpm@9.15.9 typecheck
npx pnpm@9.15.9 test
npx pnpm@9.15.9 build
```

## Fora de escopo

- `DOMAIN_HISTORY` / `AUDIT_TRAIL` empresarial
- Imutabilidade criptográfica
- Prompt 27 não executado
