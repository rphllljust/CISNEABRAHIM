# QA-LEVEL-001

| Campo | Valor |
| --- | --- |
| Document ID | Níveis de teste |
| Prompt | 15 |

## Níveis

| Nível | Escopo | PG real | Mock permitido |
| --- | --- | --- | --- |
| L1 — Domain unit | Aggregates, VOs, SM guards, policies | Não | Repos in-memory só lógica pura |
| L2 — Application unit | Handlers com domínio real | Não | Ports externos (email, S3) |
| L3 — DB integration | UNQ, CHK, FK, row_version, FOR UPDATE | **Sim obrigatório** | **Não** mock PG behavior |
| L4 — API integration | HTTP + auth + TX completa | **Sim** | IdP stub OK; não mock UNQ |
| L5 — Contract | OpenAPI, webhook schema inbox | Parcial | Wire mock externo |
| L6 — E2E | Playwright jornada UI | Sim (env test) | IdP test realm |
| L7 — Security | SEC-TEST automatizado | Sim | — |
| L8 — Performance | k6/Artillery futuro | Staging | — |

## Cenários por nível (contagem TEST-CAND)

| Nível | TEST-CAND | % |
| --- | --- | --- |
| L1 | 012–015, 020–022, 030–032 | ~18 |
| L3 | 001–004, 033–038, 045–048 | ~16 |
| L4 | 005–011, 039–044, 049–052 | ~22 |
| L6 | 053–058 | 6 |
| L7 | mapeia SEC-TEST | overlap L4 |

## Regra mocks

| Pode mockar | Não mockar |
| --- | --- |
| IdP token | Unique violation behavior |
| S3 upload (L2) | Deadlock / serialization |
| ERP HTTP outbound | CHECK constraint reject |
| Clock (com cuidado) | row_version lost update |

## Execução CI

| Job | Níveis | Frequência |
| --- | --- | --- |
| `test:unit` | L1–L2 | cada push |
| `test:integration` | L3–L4 | cada push |
| `test:e2e` | L6 | main + nightly |
| `test:security` | L7 subset | main |

## PostgreSQL

Testcontainers `postgres:18` — migrations aplicadas; rollback entre testes via transaction ou truncate schema.
