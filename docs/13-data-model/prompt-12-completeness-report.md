# DM-P12-REP-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Relatório de completude — Prompt 12 |
| Prompt      | 12                                  |
| Data        | 2026-08-29                          |

## Escopo executado

Modelo lógico relacional candidato e proteções PostgreSQL **sem DDL, sem migrations, sem banco**.

## Artefatos

| Categoria                       | Qtd | IDs                          |
| ------------------------------- | --- | ---------------------------- |
| Arquivos pasta `13-data-model/` | 25  | README + 24 temas            |
| Tabelas candidatas              | 25  | TBL-CAND-001..025            |
| Unicidade candidata             | 16  | UNQ-CAND-001..016            |
| Check constraints               | 14  | CHK-CAND-001..014            |
| FK candidatas                   | 32  | foreign-key-strategy.md      |
| INDEX_HYPOTHESIS                | 18  | IDX-HYP-001..018             |
| Cardinalidades pendentes        | 12  | CARD-DDP herdadas            |
| Riscos                          | 12  | DATA-RISK-001..012           |
| Schemas lógicos                 | 16  | relational-model-overview.md |

## Rastreabilidade

| Origem                | Destino                            |
| --------------------- | ---------------------------------- |
| 14 AGG-CAND           | TBL-CAND mapeadas                  |
| 22 INV                | UNQ/CHK/FK referenciadas           |
| 12 CARD-DDP           | unresolved-cardinalities.md        |
| BC ownership          | context-data-ownership (Prompt 06) |
| Stack PG 18 + Drizzle | migration-principles.md (futuro)   |

## Quality gate

| Critério                        | Resultado                    |
| ------------------------------- | ---------------------------- |
| Modelo rastreável ao domínio    | PASS                         |
| Nullability justificada         | PASS                         |
| Constraints → invariantes       | PASS (parcial — INV pending) |
| Histórico e audit separados     | PASS                         |
| Dados sensíveis classificados   | PASS                         |
| Nenhuma migration/schema criado | PASS                         |
| Prompt 13 não executado         | PASS                         |

**Resultado geral: PASS_WITH_RESTRICTIONS**

### Restrições

1. 12 CARD-DDP abertas impedem UNQ/FK definitivas
2. 4 INV em PENDING_BUSINESS_DECISION / PENDING_SOURCE_VALIDATION
3. Retenção de dados não definida
4. SRC-001 não totalmente validado para PO/medição
5. Índices permanecem INDEX_HYPOTHESIS

## Tabelas por status

| Status                    | Count |
| ------------------------- | ----- |
| CANDIDATE                 | 20    |
| PENDING_CARDINALITY       | 3     |
| PENDING_BUSINESS_DECISION | 2     |

## Próximo prompt

Prompt 13 — **não executado** conforme instrução.

## Checklist arquivos (25/25)

- [x] README.md
- [x] logical-model-method.md
- [x] relational-model-overview.md
- [x] table-candidates.md
- [x] column-semantics.md
- [x] key-strategy.md
- [x] foreign-key-strategy.md
- [x] uniqueness-constraints.md
- [x] check-constraints.md
- [x] nullability-policy.md
- [x] monetary-data-policy.md
- [x] quantity-and-unit-policy.md
- [x] temporal-data-policy.md
- [x] versioning-and-concurrency-columns.md
- [x] soft-delete-and-cancellation.md
- [x] document-storage-references.md
- [x] audit-data-separation.md
- [x] indexing-hypotheses.md
- [x] data-retention-pending.md
- [x] migration-principles.md
- [x] logical-data-dictionary.md
- [x] erd-candidate.md
- [x] unresolved-cardinalities.md
- [x] data-model-risks.md
- [x] prompt-12-completeness-report.md
