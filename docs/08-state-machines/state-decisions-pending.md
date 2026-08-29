# SM-SDD-001

| Campo       | Valor                                          |
| ----------- | ---------------------------------------------- |
| Document ID | Decisões pendentes de máquinas de estado       |
| Total       | 8 (SDD-001..008) + 8 reabertura (SDD-R01..R08) |
| Prompt      | 07                                             |

## SDD-001 — “Convertida” é estado, evento ou vínculo?

| Campo                   | Valor                                                 |
| ----------------------- | ----------------------------------------------------- |
| Opções                  | Estado terminal / Evento DE-003 / Atributo vínculo OS |
| Recomendação engenharia | Atributo + evento (hipótese)                          |
| Fonte                   | CMD-003                                               |
| Status                  | OPEN                                                  |
| DDP relacionado         | —                                                     |

## SDD-002 — Estado INTERROMPIDA na OS

| Opções | Estado / Evento / Não suportado |
| Fonte | Ausente SRC-001 |
| Status | OPEN — favorece não suportado |

## SDD-003 — PAUSA em execução

| Opções | STATE-CAND-052 vs evento |
| Fonte | Ausente |
| Status | OPEN — STATE-CAND-052 REJECTED |

## SDD-004 — Pagamento PARCIAL

| Opções | Estado vs múltiplos registros |
| Requisito confirmado | **Não** |
| Status | OPEN |

## SDD-005 — Estorno de pagamento

| Opções | Estado ESTORNADO vs evento compensação |
| Requisito confirmado | **Não** |
| DDP | DDP-012 |
| Status | OPEN |

## SDD-006 — Retry de notificação

| Questão | FALHOU → PENDENTE permitido? Mesmo correlation id? |
| Status | OPEN |

## SDD-007 — Compensação faturamento

| Questão | LIBERADO pode reverter? Saga? |
| Status | OPEN |

## SDD-008 — ASSIGNED como pré-condição de execução

| Questão | CMD-008 exige CMD-006 prévio? |
| DDP | DDP-032 |
| Status | OPEN |

## Reabertura (referência)

SDD-R01..R08 em [cancellation-and-reopening-analysis.md](./cancellation-and-reopening-analysis.md) — vinculados a DDP-005.

## DDPs upstream não resolvidos

DDP-004, DDP-005, DDP-010, DDP-012, DDP-032 bloqueiam confirmação de transições.
