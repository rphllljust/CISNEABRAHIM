# DM-INDEX-001

| Campo | Valor |
| --- | --- |
| Document ID | Modelo de domínio conceitual — índice |
| Fase | FOUNDATION — modelo lógico candidato |
| Código / ORM / tabelas | **0** |
| Prompt | 11 |

> Aggregates **candidatos**. Nenhum `FINAL`. Sem schema físico.

## Arquivos (20)

| Arquivo | Conteúdo |
| --- | --- |
| [modeling-method.md](./modeling-method.md) | Método e tipos |
| [conceptual-domain-model.md](./conceptual-domain-model.md) | Visão + Mermaid |
| [entity-candidates.md](./entity-candidates.md) | ENTITY-CAND-* |
| [value-object-candidates.md](./value-object-candidates.md) | VO-CAND-* |
| [aggregate-candidates.md](./aggregate-candidates.md) | AGG-CAND-* |
| [aggregate-root-analysis.md](./aggregate-root-analysis.md) | Análise de roots |
| [aggregate-invariant-matrix.md](./aggregate-invariant-matrix.md) | INV × AGG |
| [identity-strategy.md](./identity-strategy.md) | Identidades |
| [lifecycle-ownership.md](./lifecycle-ownership.md) | Ciclos × owner |
| [relationship-analysis.md](./relationship-analysis.md) | Relações |
| [cardinality-decisions-pending.md](./cardinality-decisions-pending.md) | CARD-DDP-* |
| [temporal-modeling.md](./temporal-modeling.md) | Tempo |
| [monetary-modeling.md](./monetary-modeling.md) | Dinheiro |
| [quantity-and-unit-modeling.md](./quantity-and-unit-modeling.md) | Quantidade |
| [external-reference-modeling.md](./external-reference-modeling.md) | Refs externas |
| [document-modeling.md](./document-modeling.md) | Doc/versão/arquivo |
| [audit-history-modeling.md](./audit-history-modeling.md) | Auditoria |
| [domain-model-risks.md](./domain-model-risks.md) | DM-RISK |
| [model-decisions-pending.md](./model-decisions-pending.md) | MDDP-* |
| [prompt-11-completeness-report.md](./prompt-11-completeness-report.md) | Relatório |

## Totais

| Artefato | Quantidade |
| --- | --- |
| Aggregates candidatos (AGG-CAND) | 14 |
| ACCEPTED_FOR_LOGICAL_MODELING | 4 (001, 002, 006, 013) |
| Entidades candidatas (ENTITY-CAND) | 26 |
| Value objects (VO-CAND) | 22 |
| Cardinalidades pendentes (CARD-DDP) | 12 |
| Decisões modelo (MDDP) | 11 |
| Riscos (DM-RISK) | 12 |
| Invariantes mapeadas | 22/22 |

## Cadeia

```text
TERM → ENTITY/VO → AGG-CAND → INV → CMD → SM-CAND
```
