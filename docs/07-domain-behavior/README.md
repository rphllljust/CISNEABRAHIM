# DBEH-INDEX-001

| Campo             | Valor                             |
| ----------------- | --------------------------------- |
| Document ID       | Comportamento de domínio — índice |
| Fonte             | SRC-001                           |
| Status documental | CANDIDATE — sem fonte primária    |
| Gerado em         | 2026-08-28                        |
| Prompt            | 06                                |

> Formalização **candidata** de invariantes, comandos e eventos. Nenhum aggregate, estado definitivo ou código.

## Arquivos (24)

| Arquivo                                                                    | Conteúdo                           |
| -------------------------------------------------------------------------- | ---------------------------------- |
| [behavior-modeling-method.md](./behavior-modeling-method.md)               | Método e classificações            |
| [invariant-register.md](./invariant-register.md)                           | INV-001..INV-022                   |
| [command-register.md](./command-register.md)                               | CMD-001..CMD-022                   |
| [domain-event-register.md](./domain-event-register.md)                     | DE-001..DE-020                     |
| [rejection-reason-catalog.md](./rejection-reason-catalog.md)               | REJ-001..REJ-018                   |
| [business-predicate-catalog.md](./business-predicate-catalog.md)           | PRED-001..PRED-012                 |
| [business-policy-candidates.md](./business-policy-candidates.md)           | Políticas POL-*                    |
| [domain-service-candidates.md](./domain-service-candidates.md)             | DSVC-* candidatos                  |
| [consistency-boundary-candidates.md](./consistency-boundary-candidates.md) | Fronteiras de consistência         |
| [transaction-classification.md](./transaction-classification.md)           | Classificação transacional por CMD |
| [concurrency-matrix.md](./concurrency-matrix.md)                           | Matriz de concorrência             |
| [idempotency-matrix.md](./idempotency-matrix.md)                           | Matriz de idempotência             |
| [uniqueness-requirements.md](./uniqueness-requirements.md)                 | Unicidade empresarial              |
| [financial-integrity-rules.md](./financial-integrity-rules.md)             | Integridade financeira             |
| [resource-exclusivity-rules.md](./resource-exclusivity-rules.md)           | Exclusividade de recurso           |
| [temporal-rules.md](./temporal-rules.md)                                   | Regras temporais                   |
| [command-event-causality.md](./command-event-causality.md)                 | CMD → DE                           |
| [domain-history-policy.md](./domain-history-policy.md)                     | DOMAIN_HISTORY                     |
| [audit-separation-policy.md](./audit-separation-policy.md)                 | Auditoria vs domínio               |
| [integration-event-candidates.md](./integration-event-candidates.md)       | Eventos de integração              |
| [behavior-traceability.md](./behavior-traceability.md)                     | Rastreabilidade                    |
| [behavior-open-decisions.md](./behavior-open-decisions.md)                 | Decisões abertas                   |
| [prompt-06-completeness-report.md](./prompt-06-completeness-report.md)     | Relatório                          |

## Cadeia

```text
EV → BR → FR/UC → INV → CMD → DE / REJ
```

## Totais

| Artefato             | Quantidade |
| -------------------- | ---------- |
| Invariantes (INV)    | 22         |
| Comandos (CMD)       | 22         |
| Eventos domínio (DE) | 20         |
| Rejeições (REJ)      | 18         |
| Predicados (PRED)    | 12         |
| INV CONFIRMED        | **0**      |

## Referências

- Contextos: [`../06-domain-boundaries/bounded-context-candidates.md`](../06-domain-boundaries/bounded-context-candidates.md)
- Concorrência NFR: [`../04-quality-attributes/concurrency-and-idempotency-quality.md`](../04-quality-attributes/concurrency-and-idempotency-quality.md)
- Comandos Prompt 01: [`../02-source-analysis/command-candidates.md`](../02-source-analysis/command-candidates.md)
