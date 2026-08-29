# QA-DB-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Testes constraints banco            |
| SGBD        | PostgreSQL 18 real (Testcontainers) |
| Prompt      | 15                                  |

## Regra

**Mocks não validam comportamento PostgreSQL** — UNQ, CHK, FK, FOR UPDATE, serialization failure.

## UNQ-CAND → TEST

| UNQ-CAND     | TEST-CAND | Assert                 |
| ------------ | --------- | ---------------------- |
| UNQ-CAND-001 | 036       | UniqueViolation intake |
| UNQ-CAND-004 | 001,003   | segunda OS mesma SR    |
| UNQ-CAND-005 | 020       | alocação ativa dup     |
| UNQ-CAND-006 | 017       | medição dup            |
| UNQ-CAND-007 | 011       | NF dup                 |
| UNQ-CAND-008 | 012       | pagamento dup          |
| UNQ-CAND-009 | 035       | versão doc             |
| UNQ-CAND-011 | 043       | external mapping       |

## CHK-CAND → TEST

| CHK-CAND     | TEST-CAND |
| ------------ | --------- |
| CHK-CAND-001 | 033       |
| CHK-CAND-004 | 034       |
| CHK-CAND-007 | 038       |
| CHK-CAND-009 | 029       |

## FK → TEST

| FK                 | TEST-CAND               |
| ------------------ | ----------------------- |
| service_request_id | 037                     |
| orphan insert      | negativo — REJ rollback |

## row_version

TEST-CAND-006 — UPDATE 0 rows → app 409.

## FOR UPDATE / deadlock

TEST-CAND-008,009,020 — TXN-TEST-006,007.

## Setup

1. `pnpm test:integration` sobe container
2. Apply migrations
3. Each test: `BEGIN` + `ROLLBACK` ou truncate

## Não testar em unit mock

Qualquer teste que espera `23505 unique_violation` → **L3 only**.
