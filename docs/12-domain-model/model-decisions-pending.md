# DM-MDDP-001

| Campo       | Valor                        |
| ----------- | ---------------------------- |
| Document ID | Decisões de modelo pendentes |
| Total       | 11 (MDDP-001..011)           |
| Prompt      | 11                           |

| ID       | Questão                                  | Opções                            | Prioridade |
| -------- | ---------------------------------------- | --------------------------------- | ---------- |
| MDDP-001 | Histórico OS: filho AGG-002 vs BC-017    | Filho / Separado / Event sourcing | Alta       |
| MDDP-002 | Responsável OS: entidade vs evento       | ENTITY-022 / DE-005 only          | Média      |
| MDDP-003 | Precisão decimal MoneyAmount             | 2/4 casas BRL                     | Alta       |
| MDDP-004 | ConsumoPO: entidade vs evento            | ENTITY-023 / ledger event         | Alta       |
| MDDP-005 | UUID v7 vs ULID vs sequência             | ID strategy                       | Média      |
| MDDP-006 | Timezone storage                         | UTC instant / local               | Média      |
| MDDP-007 | Bi-temporal necessário?                  | Sim / Não                         | Baixa      |
| MDDP-008 | Política arredondamento                  | half-up / banker's                | Média      |
| MDDP-009 | Conversão unidade medida                 | Tabela / proibido                 | Média      |
| MDDP-010 | Nota fiscal compartilha LogicalDocument? | Unificar / Separar                | Média      |
| MDDP-011 | Medição como fase vs entidade            | DBND-004                          | Alta       |

## DDPs empresariais bloqueantes

DDP-009 (PO), DDP-010 (medição), DDP-011 (faturamento), DDP-012 (pagamento), DDP-013 (documentos).

## Sem FINAL

Nenhum aggregate marcado FINAL — máximo ACCEPTED_FOR_LOGICAL_MODELING (4).
