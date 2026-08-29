# Relatório de normalização de regras

| Campo | Valor |
| --- | --- |
| Document ID | RNR-001 |
| Prompt | 01 |
| CONFIRMED produzidas | **0** |

## Achados

| # | Achado | Ação tomada |
| --- | --- | --- |
| 1 | BR-001..BR-003 originadas em SRC-000 sem EV | Atualizadas com referências EV de SRC-001 |
| 2 | Múltiplas afirmações de SRC-001 misturam as-is, to-be e proibição | Separadas em EV com `Temporal orientation` distinto |
| 3 | Termos “deve” em SRC-001 frequentemente indicam desejo, não norma vigente | BR marcadas CANDIDATE; nenhuma CONFIRMED |
| 4 | Lista §11 ITEM_* é orientação de engenharia, não regra empresarial | BR-010 como CANDIDATE; quantity-semantics como interpretação |
| 5 | Proibições de cardinalidade (§12) duplicam espírito de BR-002 | BR-013 criada para granularidade |
| 6 | “Solicitar ≠ autorizar” e “rascunho ≠ liberar” são distintas | BR-025 e BR-007 separadas |
| 7 | Problemas §4 não foram convertidos em regras positivas | BR-024 como metarregra de investigação |
| 8 | Regras de PO específico vs global | BR-018 extraída de EV-072 |
| 9 | Fiscal explicitamente bloqueado | BR-019; nenhuma regra fiscal inventada |
| 10 | Locação como prioridade ≠ escopo confirmado | BR-020 com status CANDIDATE de escopo |

## Duplicatas evitadas

| Tema | Consolidação |
| --- | --- |
| Solicitação vs OS | BR-001 + EV-028 |
| Encadeamento comercial | BR-002 + BR-013 |
| Atividades múltiplas | BR-003 |

## Itens não normalizados (intencional)

| Item | Motivo |
| --- | --- |
| Papéis e permissões nomeados | Sem fonte |
| Faixas de aging | Proibido inventar |
| Cardinalidades PO:OS | DECISION_PENDING |
| CFOP, impostos, NF-e | Fonte fiscal NOT_PROVIDED |

## Próximo passo

Prompt 02 poderá derivar HLR a partir de BR CANDIDATE **após** validação adicional — não automática nesta fase.
