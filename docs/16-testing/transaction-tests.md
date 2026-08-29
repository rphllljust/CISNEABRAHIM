# QA-TXN-001

| Campo | Valor |
| --- | --- |
| Document ID | Testes transacionais |
| Herda | TXN-TEST-001..018 |
| Prompt | 15 |

| TXN-TEST | TEST-CAND | Nível |
| --- | --- | --- |
| TXN-TEST-001 | 002 | L4 |
| TXN-TEST-002 | 003 | L3 |
| TXN-TEST-003 | 006 | L3 |
| TXN-TEST-004 | 010 | L4 |
| TXN-TEST-005 | 008 | L3 |
| TXN-TEST-006 | 009 | L3 |
| TXN-TEST-007 | 020 | L3 |
| TXN-TEST-008 | 019 | L3 |
| TXN-TEST-009 | 029 | L1+L3 |
| TXN-TEST-010 | 017 | L3 |
| TXN-TEST-011 | 041 | L4 |
| TXN-TEST-012 | 011 | L3 |
| TXN-TEST-013 | 012 | L4 |
| TXN-TEST-014 | 049 | L4 |
| TXN-TEST-015 | 035 | L3 |
| TXN-TEST-016 | 046 | L4 |
| TXN-TEST-017 | 009 | L3 |
| TXN-TEST-018 | 004 | L3 |

## Boundary CB-002 CMD-003

TEST-CAND-001–004 — rollback verificado via PG: count rows após forced fail.

## Boundary CB-003 PO+OS

TEST-CAND-008,009 — saldo antes/depois na mesma TX.

## Falha antes/depois commit

| Cenário | TEST |
| --- | --- |
| Exception mid-handler | 004 — no orphan audit |
| Timeout retry | 002,049 |

## Gate

TXN-TEST-001..015 equivalentes PASS antes release financeiro.
