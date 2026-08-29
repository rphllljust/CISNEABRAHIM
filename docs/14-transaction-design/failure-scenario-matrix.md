# TXN-FAIL-001

| Campo | Valor |
| --- | --- |
| Document ID | Matriz cenários de falha |
| Total | 24 (TXN-FAIL-001..024) |
| Prompt | 13 |

| ID | Comando | Falha | Antes commit | Após commit | Efeito externo | Mitigação |
| --- | --- | --- | --- | --- | --- | --- |
| TXN-FAIL-001 | CMD-003 | Dup conversão | Rollback | N/A — UNQ impede | — | Retornar OS existente |
| TXN-FAIL-002 | CMD-003 | Crash mid-TX | Rollback SR+OS | — | — | Retry idempotente |
| TXN-FAIL-003 | CMD-005 | Saldo PO insuficiente | Rollback | — | — | REJ-011 |
| TXN-FAIL-004 | CMD-005 | row_version OS | Rollback | — | — | 409 client |
| TXN-FAIL-005 | CMD-005 | Notif falhou | — | OS liberada | Pós-commit fail | Outbox retry |
| TXN-FAIL-006 | CMD-015 | Recurso tomado | Rollback | — | — | REJ-005 |
| TXN-FAIL-007 | CMD-015 | Deadlock | Rollback | — | — | Retry 3x |
| TXN-FAIL-008 | PO-CONSUME | Lost update saldo | Rollback | — | — | FOR UPDATE |
| TXN-FAIL-009 | CMD-010 | Cancel concorrente | Rollback | — | — | REJ INV-015 |
| TXN-FAIL-010 | CMD-010 | Já concluída | — | No-op | — | Idempotente |
| TXN-FAIL-011 | CMD-017 | Medição dup | Rollback | — | — | UNQ/REJ-008 |
| TXN-FAIL-012 | CMD-017 | Timeout cliente | ? | Pode existir | — | Retry idem key |
| TXN-FAIL-013 | CMD-019 | Medição não aprovada | Rollback | — | — | REJ |
| TXN-FAIL-014 | CMD-019 | Double prep race | Rollback | — | — | UNQ-015 |
| TXN-FAIL-015 | CMD-020 | NF dup key | Rollback | — | — | REJ-010 |
| TXN-FAIL-016 | CMD-020 | Timeout + committed | — | Nota existe | — | Idempotent 200 |
| TXN-FAIL-017 | CMD-021 | Dup payment | Rollback | — | — | UNQ-008 |
| TXN-FAIL-018 | CMD-021 | Local ok ERP fail | — | Local ok | ERP fail | Reconcile |
| TXN-FAIL-019 | CMD-021 | ERP ok local fail | — | — | ERP charged? | Inbox + reconcile |
| TXN-FAIL-020 | CMD-022 | Version race | Rollback | — | — | FOR UPDATE head |
| TXN-FAIL-021 | CMD-022 | Storage fail pós-commit | — | Version ok | Orphan file | Cleanup job |
| TXN-FAIL-022 | Inbox | Dup webhook | Skip insert | — | — | Dedup |
| TXN-FAIL-023 | Inbox | Poison payload | — | FAILED staging | — | Manual |
| TXN-FAIL-024 | Any | Serialization abort | Rollback | — | — | Retry SER |

## Legenda

| Antes commit | Domínio inconsistente apenas se bug — PG rollback limpa |
| Após commit | Estado persistido — compensação ou idempotência |
| Efeito externo | Fora ACID — outbox/reconcile |

## Nenhum caso aceita lost update silencioso

TXN-FAIL-004, 008, 014, 020 exigem conflito explícito ou UNQ.
