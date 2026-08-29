# DM-QG-001 — Prompt 11 completeness report

| Campo     | Valor                                     |
| --------- | ----------------------------------------- |
| Prompt    | 11                                        |
| Título    | Modelo conceitual e aggregates candidatos |
| Gerado em | 2026-08-28                                |
| Resultado | PASS_WITH_RESTRICTIONS                    |

## Pré-condições

| Item                        | Status    |
| --------------------------- | --------- |
| Prompt 10 commitado         | `aaa8808` |
| Stack documentada           | Sim       |
| Working tree limpo (início) | Sim       |
| Prompt 12 executado         | **Não**   |

## Entregáveis

| Item                           | Esperado | Entregue |
| ------------------------------ | -------- | -------- |
| Arquivos docs/12-domain-model/ | 20       | 20       |
| ORM / tabelas / código         | 0        | 0        |

## Contagens

| Artefato                            | Quantidade             |
| ----------------------------------- | ---------------------- |
| Aggregates candidatos (AGG-CAND)    | 14                     |
| ACCEPTED_FOR_LOGICAL_MODELING       | 4 (001, 002, 006, 013) |
| Entidades (ENTITY-CAND)             | 26                     |
| Value objects (VO-CAND)             | 22                     |
| Cardinalidades pendentes (CARD-DDP) | 12                     |
| Decisões modelo (MDDP)              | 11                     |
| Riscos (DM-RISK)                    | 12                     |
| Invariantes mapeadas                | 22/22                  |
| Aggregates FINAL                    | **0**                  |

## ACCEPTED_FOR_LOGICAL_MODELING

| AGG          | Nome            |
| ------------ | --------------- |
| AGG-CAND-001 | ServiceRequest  |
| AGG-CAND-002 | ServiceOrder    |
| AGG-CAND-006 | Measurement     |
| AGG-CAND-013 | LogicalDocument |

## Quality gate

| Critério                                     | Resultado        |
| -------------------------------------------- | ---------------- |
| Invariantes atribuídas                       | PASS 22/22       |
| Aggregates pequenos e justificados           | PASS             |
| Refs por identidade                          | PASS             |
| Cardinalidades desconhecidas visíveis        | PASS 12 CARD-DDP |
| Sem ORM/tabela/código                        | PASS             |
| Prompt 12 não executado                      | PASS             |
| Solicitação ≠ OS                             | PASS             |
| PO/item/consumo pendente                     | PASS             |
| Planejado/alocado/realizado distintos        | PASS             |
| Doc/versão/arquivo distintos                 | PASS             |
| Medição/faturamento/nota/pagamento separados | PASS             |
| Sem objeto gigante                           | PASS             |

**Quality gate:** PASS_WITH_RESTRICTIONS

## Restrições

- SRC-001 não validada — 0 FINAL
- PO, pagamento, medição entity vs fase pendentes
- Persistência Drizzle — Prompt 12+ não executado

## Rastreabilidade

- requirements-traceability.md
- prompt-execution-log.md
- docs/README.md

## Próximo passo

Prompt 12 — **não executado**.
