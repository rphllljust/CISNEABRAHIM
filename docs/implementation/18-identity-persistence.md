# Prompt 18 — Persistência segura de identidade

| Campo  | Valor                                                        |
| ------ | ------------------------------------------------------------ |
| Prompt | 18                                                           |
| ADRs   | ADR-TECH-004, ADR-TECH-005                                   |
| Status | Implementado (persistência apenas; AuthN runtime Prompt 20+) |

## Modelo implementado

Schema PostgreSQL dedicado **`identity`** — separado de `infrastructure` (Prompt 17) e de qualquer domínio empresarial.

Alinhado a SEC-DEC-002 (JWT access + **refresh rotativo** com família server-side) e session-security.md (revogação, expiração, desativação ≠ exclusão).

```text
identity.identities
    ├── identity.credentials (1:1 login/senha hash)
    ├── identity.sessions
    │       └── identity.refresh_token_families (1:1 por sessão)
    │               └── identity.refresh_tokens (hash rotativo)
```

## Tabelas técnicas

| Tabela                            | Propósito                                                 |
| --------------------------------- | --------------------------------------------------------- |
| `identity.identities`             | Conta técnica (UUID interno, status, version, timestamps) |
| `identity.credentials`            | Login normalizado + `password_hash` (nunca senha pura)    |
| `identity.sessions`               | Sessão server-side com expiração e revogação              |
| `identity.refresh_token_families` | Família de rotação de refresh (SEC-DEC-002)               |
| `identity.refresh_tokens`         | `token_hash` SHA-256 (nunca token puro)                   |

**Business tables: 0**

## Constraints e índices

| Tipo   | Exemplos                                                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| PK     | UUID `gen_random_uuid()` em todas as tabelas                                                                                           |
| UNIQUE | `credentials.login_identifier_normalized`, `credentials.identity_id`, `refresh_tokens.token_hash`, `refresh_token_families.session_id` |
| FK     | Todas com `ON DELETE RESTRICT` (sem cascade perigoso)                                                                                  |
| CHECK  | Hash mínimo (senha ≥60, token ≥64), expiração > criação, consistência `disabled_at`/`revoked_at`                                       |
| INDEX  | `identity_id`, `family_id`, `expires_at`                                                                                               |

Enums no schema `identity`: `identity_status` (`active`, `disabled`, `locked`), `session_status` (`active`, `revoked`, `expired`).

## Migration

| Arquivo                                                        | Conteúdo                                      |
| -------------------------------------------------------------- | --------------------------------------------- |
| `packages/database/migrations/0001_striped_the_liberteens.sql` | Schema `identity` + 5 tabelas + FKs + índices |

**Total migrations Prompt 18: 1** (acumulado: 2 com Prompt 17)

### Validação

1. **Banco vazio:** `pnpm db:reset` (somente volume `cisne_local_pg_data`) → `pnpm db:migrate`
2. **Estado final:** `\dt identity.*` — 5 tabelas
3. **Reexecução:** `pnpm db:migrate` idempotente (journal drizzle-kit)
4. **Rollback:** forward-only via drizzle-kit; correções em nova migration (`0002_…`)
5. **Sem domínio:** nenhuma tabela cliente/OS/PO/etc.

## Decisões

| ID         | Decisão                           | Motivo                     |
| ---------- | --------------------------------- | -------------------------- |
| ID-P18-001 | Schema `identity` dedicado        | Modularidade ADR-TECH-005  |
| ID-P18-002 | UUID interno não sequencial       | DM-ID-001 / não previsível |
| ID-P18-003 | Login normalizado único           | Unicidade no banco         |
| ID-P18-004 | Família de refresh por sessão     | SEC-DEC-002 rotação        |
| ID-P18-005 | `disabled` sem DELETE             | Desativação ≠ exclusão     |
| ID-P18-006 | Sem roles/permissões empresariais | Escopo Prompt 18           |

## Comandos de validação

```powershell
docker compose -f docker/compose.yaml up -d --wait
# Definir DATABASE_URL e TEST_DATABASE_URL (ver .env.example)
pnpm db:migrate
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

## Testes de integração

Pacote `@cisne/database`: `src/identity.persistence.integration.spec.ts`

| Caso                     | Evidência                          |
| ------------------------ | ---------------------------------- |
| Login duplicado          | `23505` unique violation           |
| Sessão sem identidade    | `23503` FK violation               |
| Expiração inválida       | `23514` check violation            |
| Revogação persistida     | `status=revoked`, `revoked_at` set |
| FK inválida refresh      | `23503`                            |
| NOT NULL `identity_id`   | `23502`                            |
| Sem senha/token puro     | apenas hashes armazenados          |
| Conta desabilitada       | registro permanece                 |
| Constraints ≥15          | `information_schema`               |
| Sem tabelas empresariais | query negativa                     |

**Constraints testadas: 11** (cenários de integração cobrindo unique, FK, CHECK, NOT NULL)

## Limitações

- Nenhum endpoint de autenticação (Prompt 20+)
- Nenhum mapeamento ACT/ROLE-CAND (Prompt 21+)
- Hashing de senha em runtime não implementado — coluna aceita hash pré-computado
- `replaced_by_token_id` sem FK circular (rotação em prompt futuro)
- OIDC/IdP externo não integrado (SEC-AUTHN-001)

## Arquivos de código

- `packages/database/src/schema/identity.ts`
- `packages/database/migrations/0001_striped_the_liberteens.sql`
- `packages/database/src/identity.persistence.integration.spec.ts`
