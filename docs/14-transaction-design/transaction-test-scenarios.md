# TXN-TEST-001

| Campo | Valor |
| --- | --- |
| Document ID | Cenários de teste transacional (futuro) |
| Total | 18 (TXN-TEST-001..018) |
| Prompt | 13 |
| Implementação | **NOT STARTED** |

> Especificações para Prompt 15+ e testes de integração com PostgreSQL real.

| ID | Cenário | Comando | Assert |
| --- | --- | --- | --- |
| TXN-TEST-001 | Conversão idempotente | CMD-003 | 2× request → 1 OS, mesmo id |
| TXN-TEST-002 | Conversão paralela mesma SR | CMD-003 | 1 sucesso, 1 UNQ/idempotent |
| TXN-TEST-003 | Alteração OS concorrente | CMD-013 | 2º update row_version → 409 |
| TXN-TEST-004 | Liberação dupla | CMD-005 | 2º no-op ou REJ documentado |
| TXN-TEST-005 | Liberação + PO saldo exato | CMD-005 | balance 0 após consumo |
| TXN-TEST-006 | PO saldo concorrente | PO-CONSUME | 1 sucesso, 1 REJ-011 |
| TXN-TEST-007 | Alocação mesmo recurso | CMD-015 | 1 REJ-005 |
| TXN-TEST-008 | Alocação idempotente retry | CMD-015 | mesmo allocation id |
| TXN-TEST-009 | Concluir + cancelar race | CMD-010/011 | INV-015 violação |
| TXN-TEST-010 | Medição dup submit | CMD-017 | REJ-008 |
| TXN-TEST-011 | Faturar 2× mesma medição | CMD-019 | 1 prep |
| TXN-TEST-012 | NF dup external key | CMD-020 | REJ-010 |
| TXN-TEST-013 | Pagamento idempotente | CMD-021 | 1 registro |
| TXN-TEST-014 | Pagamento timeout retry | CMD-021 | sem dup |
| TXN-TEST-015 | Doc version concurrent | CMD-022 | version monotonic |
| TXN-TEST-016 | Inbox dup message | webhook | 1 processamento |
| TXN-TEST-017 | Deadlock retry PO+OS | CMD-005 | eventual success ≤3 |
| TXN-TEST-018 | Rollback não deixa audit órfão | CMD-003 | audit só após commit |

## Ferramentas candidatas

| Ferramenta | Uso |
| --- | --- |
| Vitest + testcontainers PG | Integração TX |
| parallel workers | Race tests |
| `Promise.all` | Simular concorrência |

## Dados

Sem dados empresariais inventados como verdade — fixtures sintéticas UUID.

## Quality gate futuro

Todos TXN-TEST críticos (001-015) PASS antes produção financeira.
