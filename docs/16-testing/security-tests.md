# QA-SEC-001

| Campo | Valor |
| --- | --- |
| Document ID | Testes segurança |
| Herda | SEC-TEST-001..022 |
| Prompt | 15 |

## Mapeamento SEC-TEST → TEST-CAND

| SEC-TEST | TEST-CAND | Nível |
| --- | --- | --- |
| SEC-TEST-001 | backlog MFA | L7 |
| SEC-TEST-002 | 047 | L7 |
| SEC-TEST-003 | backlog | L7 |
| SEC-TEST-004 | 052 | L4 |
| SEC-TEST-005 | backlog | L7 |
| SEC-TEST-006 | 048 | L7 |
| SEC-TEST-007 | 005 | L4 |
| SEC-TEST-008 | 002 | L4 |
| SEC-TEST-009 | 004 | L3 |
| SEC-TEST-010 | 021 | L4 |
| SEC-TEST-011 | 008 | L3 |
| SEC-TEST-012 | 022 | L4 |
| SEC-TEST-013 | 020 | L3 |
| SEC-TEST-014 | 022 | L4 |
| SEC-TEST-015 | 014 | L4 |
| SEC-TEST-016 | 025 | L4 |
| SEC-TEST-017 | 024 | L4 |
| SEC-TEST-018 | 018 | L4 |
| SEC-TEST-019 | 045 | L4 |
| SEC-TEST-020 | 011 | L3 |
| SEC-TEST-021 | 012 | L4 |
| SEC-TEST-022 | 058 | L4 |

## Categorias

| Categoria | Foco |
| --- | --- |
| AuthN negativa | 047,048 |
| AuthZ negativa | 005,021–028 |
| Data exposure | 014,025 |
| Injection | input validation backlog ZAP |
| Upload | 057 |
| Integration spoof | 045 |

## CRITICAL gate

SEC-TEST-002,007,010,012,015,016,018,019 — PASS antes prod.

## SAST/DAST

| Ferramenta | Quando |
| --- | --- |
| Semgrep CI | cada push |
| OWASP ZAP | nightly staging |

## Negativa obrigatória

Todo SEC-TEST CRITICAL tem assert **deny** — não só happy path.
