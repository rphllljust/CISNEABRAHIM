# QA-REC-001

| Campo       | Valor              |
| ----------- | ------------------ |
| Document ID | Testes recuperação |
| Prompt      | 15                 |

## Cenários

| ID      | Cenário                    | TEST-CAND | Assert            |
| ------- | -------------------------- | --------- | ----------------- |
| REC-001 | Handler throw mid-TX       | 004       | rollback PG count |
| REC-002 | DB connection drop         | backlog   | graceful 503      |
| REC-003 | Partial outbox fail        | backlog   | domain committed  |
| REC-004 | Retry after 503 idempotent | 002,049   | no dup            |
| REC-005 | Deadlock retry success     | 009       | ≤3 attempts       |
| REC-006 | Inbox poison               | 050       | staging FAILED    |

## TXN-FAIL mapping

TXN-FAIL-002,018,021,023 → recovery tests.

## Chaos (futuro)

| Experimento          | Env            |
| -------------------- | -------------- |
| Kill PG mid-TX       | staging manual |
| Network partition S3 | staging        |

## Não simular em unit

Rollback real — L3 com `ROLLBACK` assert.

## RPO/RTO

TARGET_NOT_DEFINED — ver `docs/19-operations/backup-strategy.md` (Prompt 84) e `docs/19-operations/dr-restore-runbook.md` (Prompt 85). Teste de recovery time permanece pendente até DDP-016.
