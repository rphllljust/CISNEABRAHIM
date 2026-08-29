# TXN-INDEX-001

| Campo | Valor |
| --- | --- |
| Document ID | Arquitetura de transações — índice |
| Fase | FOUNDATION — **sem implementação** |
| Prompt | 13 |
| Herda | ADR-004, DBEH-TXN-001, DM-VER-001, QATTR-CONC-001 |

> Estratégia técnica **candidata** para integridade transacional, concorrência e idempotência antes do código.

## Arquivos (21)

| Arquivo | Conteúdo |
| --- | --- |
| [transaction-boundaries.md](./transaction-boundaries.md) | Boundaries por aggregate/BC |
| [use-case-transaction-matrix.md](./use-case-transaction-matrix.md) | Análise obrigatória por comando crítico |
| [isolation-level-analysis.md](./isolation-level-analysis.md) | Níveis PostgreSQL por cenário |
| [optimistic-concurrency-design.md](./optimistic-concurrency-design.md) | row_version, conflitos |
| [pessimistic-locking-analysis.md](./pessimistic-locking-analysis.md) | SELECT FOR UPDATE, advisory |
| [exclusive-resource-design.md](./exclusive-resource-design.md) | INV-004, alocação |
| [financial-race-analysis.md](./financial-race-analysis.md) | Corridas financeiras |
| [idempotency-design.md](./idempotency-design.md) | Padrão geral |
| [idempotency-key-scope.md](./idempotency-key-scope.md) | Escopo por comando |
| [duplicate-detection.md](./duplicate-detection.md) | UNQ + dedup |
| [retry-policy-design.md](./retry-policy-design.md) | Retry seguro |
| [external-side-effect-design.md](./external-side-effect-design.md) | Efeitos fora do commit |
| [outbox-pattern-assessment.md](./outbox-pattern-assessment.md) | Avaliação outbox |
| [inbox-deduplication-assessment.md](./inbox-deduplication-assessment.md) | Inbox BC-018 |
| [reconciliation-design.md](./reconciliation-design.md) | Conciliação |
| [compensation-analysis.md](./compensation-analysis.md) | Compensação vs rollback |
| [failure-scenario-matrix.md](./failure-scenario-matrix.md) | Falha antes/depois commit |
| [transaction-test-scenarios.md](./transaction-test-scenarios.md) | Cenários de teste futuro |
| [transaction-decisions.md](./transaction-decisions.md) | TXN-DEC-* |
| [prompt-13-completeness-report.md](./prompt-13-completeness-report.md) | Relatório |

## Totais

| Artefato | Quantidade |
| --- | --- |
| Comandos críticos analisados | 11 |
| Decisões candidatas (TXN-DEC) | 14 |
| Cenários de falha (TXN-FAIL) | 24 |
| Cenários de teste (TXN-TEST) | 18 |
| Riscos transacionais (TXN-RISK) | 10 |
| Operações FINANCIAL_RACE classificadas | 6 |
| Outbox | PROPOSED (não ACCEPTED) |

## Princípios deste prompt

1. **Nenhuma estratégia global** — optimistic vs pessimistic por cenário.
2. **Nenhum lost update silencioso** — conflito explícito ou retry controlado.
3. **Efeito externo separado do commit local** — outbox ou pós-commit assíncrono candidato.
4. **Retry não duplica efeito** — idempotência obrigatória onde classificado.
5. **Sem código, migrations ou filas implementadas.**

## Cadeia

```text
CMD → boundary → isolation → lock strategy → idempotency → external effect → reconcile
```
