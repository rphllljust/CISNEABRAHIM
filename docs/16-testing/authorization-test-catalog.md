# QA-AUTHZ-001

| Campo       | Valor                         |
| ----------- | ----------------------------- |
| Document ID | Catálogo testes autorização   |
| Herda       | TSC-AUTH-001..018 (Prompt 08) |
| Prompt      | 15                            |

## Negativos obrigatórios (L4)

| TSC-AUTH     | TEST-CAND | CMD          | Assert         |
| ------------ | --------- | ------------ | -------------- |
| TSC-AUTH-001 | 005       | CMD-005      | 403 + DENY-003 |
| TSC-AUTH-002 | 022       | CMD-009      | 403 escopo     |
| TSC-AUTH-003 | 023       | GET resource | 401/403        |
| TSC-AUTH-004 | 024       | CMD-013      | DENY-008       |
| TSC-AUTH-005 | 021       | CMD-005      | SOD-002        |
| TSC-AUTH-006 | 028       | any          | AUTHZ-041      |
| TSC-AUTH-007 | backlog   | CMD-005      | delegação      |
| TSC-AUTH-008 | 018       | CMD-018      | DENY-011       |
| TSC-AUTH-009 | 027       | CMD-021      | SOD-012        |
| TSC-AUTH-010 | backlog   | CMD-021      | SOD-007        |

## Positivos (smoke AuthZ)

| TSC-AUTH     | TEST-CAND                             |
| ------------ | ------------------------------------- |
| TSC-AUTH-011 | 010 (liberação ok)                    |
| TSC-AUTH-012 | 025 (export margem)                   |
| TSC-AUTH-013 | 014                                   |
| TSC-AUTH-014 | 018 negado inverso — fixture 2 atores |

## Auditoria negação

| TSC-AUTH     | TEST-CAND                    |
| ------------ | ---------------------------- |
| TSC-AUTH-017 | 052 — sem vazar OS existence |
| TSC-AUTH-018 | 025                          |

## Matriz AUTHZ → TEST

42 AUTHZ — cobertura mínima: 28 ações sensíveis com ≥1 TEST-CAND (005–028, 052).

## Backend only

Testes chamam API **sem** simular guards frontend — SEC-DEC-005.

## Fixture atores

ROLE-CAND fixtures sintéticos: `actor_preparer`, `actor_authorizer`, `actor_executor`, `actor_finance` — test-data-strategy.md.
