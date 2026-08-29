# DM-REL-INDEX-001

| Campo            | Valor                           |
| ---------------- | ------------------------------- |
| Document ID      | Modelo lógico de dados — índice |
| SGBD candidato   | PostgreSQL 18 (ADR-TECH-004)    |
| ORM candidato    | Drizzle (ADR-TECH-005)          |
| DDL / migrations | **NOT STARTED**                 |
| Prompt           | 12                              |

> Tabelas e constraints **candidatas**. Sem `CREATE TABLE`, sem schema físico aplicado.

## Arquivos (25)

| Arquivo                                                                          | Conteúdo                |
| -------------------------------------------------------------------------------- | ----------------------- |
| [logical-model-method.md](./logical-model-method.md)                             | Método                  |
| [relational-model-overview.md](./relational-model-overview.md)                   | Visão por schema/módulo |
| [table-candidates.md](./table-candidates.md)                                     | TBL-CAND-*              |
| [column-semantics.md](./column-semantics.md)                                     | Semântica colunas       |
| [key-strategy.md](./key-strategy.md)                                             | PK / natural keys       |
| [foreign-key-strategy.md](./foreign-key-strategy.md)                             | FK cross-module         |
| [uniqueness-constraints.md](./uniqueness-constraints.md)                         | UNQ-CAND-*              |
| [check-constraints.md](./check-constraints.md)                                   | CHK-CAND-*              |
| [nullability-policy.md](./nullability-policy.md)                                 | NULL rules              |
| [monetary-data-policy.md](./monetary-data-policy.md)                             | Dinheiro                |
| [quantity-and-unit-policy.md](./quantity-and-unit-policy.md)                     | Quantidade              |
| [temporal-data-policy.md](./temporal-data-policy.md)                             | Timestamps              |
| [versioning-and-concurrency-columns.md](./versioning-and-concurrency-columns.md) | row_version             |
| [soft-delete-and-cancellation.md](./soft-delete-and-cancellation.md)             | Cancel ≠ delete         |
| [document-storage-references.md](./document-storage-references.md)               | Object storage          |
| [audit-data-separation.md](./audit-data-separation.md)                           | Audit vs domain         |
| [indexing-hypotheses.md](./indexing-hypotheses.md)                               | INDEX_HYPOTHESIS        |
| [data-retention-pending.md](./data-retention-pending.md)                         | Retenção                |
| [migration-principles.md](./migration-principles.md)                             | Princípios              |
| [logical-data-dictionary.md](./logical-data-dictionary.md)                       | Dicionário              |
| [erd-candidate.md](./erd-candidate.md)                                           | ERD Mermaid             |
| [unresolved-cardinalities.md](./unresolved-cardinalities.md)                     | CARD-DDP → FK           |
| [data-model-risks.md](./data-model-risks.md)                                     | DATA-RISK               |
| [prompt-12-completeness-report.md](./prompt-12-completeness-report.md)           | Relatório               |

## Totais

| Artefato                            | Quantidade |
| ----------------------------------- | ---------- |
| Tabelas candidatas (TBL-CAND)       | 25         |
| Unicidade candidata (UNQ-CAND)      | 16         |
| Check constraints (CHK-CAND)        | 14         |
| Relacionamentos FK candidatos       | 32         |
| Cardinalidades pendentes (herdadas) | 12         |
| INDEX_HYPOTHESIS                    | 18         |
| Riscos (DATA-RISK)                  | 12         |
| Schemas lógicos por módulo          | 10         |

## Cadeia

```text
AGG-CAND → TBL-CAND → UNQ/CHK → INV
```
