# SM-GUARD-REG-001

| Campo       | Valor                            |
| ----------- | -------------------------------- |
| Document ID | Registro de guardas de transição |
| Total       | 28 (GUARD-001..028)              |
| Prompt      | 07                               |

> Sem pseudocódigo. Predicados referenciam PRED-* do Prompt 06.

## GUARD-001 — Iniciar análise de solicitação

| Campo       | Valor                                |
| ----------- | ------------------------------------ |
| Transição   | TR-CAND-001                          |
| Predicado   | PRED-004 (solicitação identificável) |
| Invariantes | INV-001                              |
| Autorização | Decisor candidato                    |
| Rejeição    | REJ-001                              |
| Fonte       | SRC-001                              |
| Status      | CANDIDATE                            |

## GUARD-002 — Aprovar solicitação

| Transição | TR-CAND-002 | Predicado | PRED-004 | Status | PENDING_BUSINESS_DECISION |

## GUARD-003 — Rejeitar solicitação

| Transição | TR-CAND-003 | Motivo | Obrigatório candidato | Status | PENDING |

## GUARD-004 — Converter solicitação

| Transição | TR-CAND-004, TR-CAND-013 |
| Predicado | PRED-001 (solicitação aprovada candidata) |
| Invariantes | INV-001, INV-003 |
| Rejeição | REJ-001, REJ-014 |
| Status | CANDIDATE |

## GUARD-005 — Cancelar solicitação

| Transição | TR-CAND-005 |
| Autorização | DDP-004 |
| Dependência | Sem OS vinculada ou política compensação |
| Status | PENDING_BUSINESS_DECISION |

## GUARD-006 — Liberar OS (conteúdo)

| Transição | TR-CAND-007 |
| Predicado | PRED-001 |
| Invariantes | INV-002 |
| Rejeição | REJ-002 |
| Status | CANDIDATE |

## GUARD-007 — Liberar OS (autorização)

| Transição | TR-CAND-007 |
| Autorização | SEC-REQ-003, alçada DDP-003 |
| Rejeição | REJ-003, REJ-011 |
| Status | CANDIDATE |

## GUARD-008 — Iniciar execução

| Transição | TR-CAND-009, TR-CAND-022 |
| Predicado | PRED-003 (OS liberada) |
| Invariantes | INV-002 |
| Concorrência | EXCLUSIVE_RESOURCE |
| Rejeição | REJ-004 |
| Status | CANDIDATE |

## GUARD-009 — Concluir OS/execução

| Transição | TR-CAND-010, TR-CAND-024 |
| Predicado | PRED-005 (progresso mínimo candidato) |
| Invariantes | INV-006 |
| Rejeição | REJ-006 |
| Status | CANDIDATE |

## GUARD-010 — Cancelar OS

| Transição | TR-CAND-011 |
| Predicado | PRED-006 (não concluída/cancelada) |
| Invariantes | INV-008 |
| DDP | DDP-004 |
| Rejeição | REJ-007 |
| Status | CANDIDATE |

## GUARD-011 — Reabrir OS

| Transição | TR-CAND-012 |
| DDP | DDP-005 |
| Invariantes | INV-015 (POL-007 PENDING) |
| Status | PENDING_BUSINESS_DECISION |

## GUARD-012 — Alterar OS

| Transição | TR-CAND-015 |
| Predicado | PRED-007 (estado editável) |
| Rejeição | REJ-008 |
| Status | CANDIDATE |

## GUARD-013 — Alocar recurso

| Transição | TR-CAND-016 |
| Predicado | PRED-002 |
| Invariantes | INV-004 |
| Concorrência | EXCLUSIVE_RESOURCE |
| Rejeição | REJ-005 |
| Status | CANDIDATE |

## GUARD-014 — Aprovar medição

| Transição | TR-CAND-027 |
| DDP | DDP-010 |
| Invariantes | INV-009 |
| Status | PENDING_BUSINESS_DECISION |

## GUARD-015 — Criar medição

| Transição | TR-CAND-031 |
| Predicado | PRED-008 (OS concluída candidata) |
| Dependência | XLC-002 |
| Status | CANDIDATE |

## GUARD-016 — Preparar faturamento

| Transição | TR-CAND-036 |
| Predicado | PRED-009 (medição aprovada candidata) |
| Invariantes | INV-010 |
| Dependência | XLC-003 |
| Status | CANDIDATE |

## GUARD-017 — Liberar faturamento

| Transição | TR-CAND-038 |
| Autorização | Alçada financeira candidata |
| Status | PENDING_BUSINESS_DECISION |

## GUARD-018 — Registrar nota

| Transição | TR-CAND-040 |
| Invariantes | INV-007, INV-011 |
| Idempotência | IDEMPOTENCY_REQUIRED |
| Rejeição | REJ-010 |
| Status | CANDIDATE |

## GUARD-019 — Registrar pagamento

| Transição | TR-CAND-044 |
| DDP | DDP-012 |
| Efeito financeiro | CRITICAL |
| Status | PENDING_BUSINESS_DECISION |

## GUARD-020 — OS não cancelada

| Transição | múltiplas | Predicado | PRED-006 | Status | CANDIDATE |

## GUARD-021 — Sem dupla liberação

| Transição | TR-CAND-007 | Invariantes | INV-002 | Rejeição | REJ-002 | Status | CANDIDATE |

## GUARD-022 — Recurso disponível

| Transição | TR-CAND-016 | Predicado | PRED-002 | Status | CANDIDATE |

## GUARD-023 — Medição não duplicada

| Transição | TR-CAND-025 | Invariantes | INV-009 parcial | Status | CANDIDATE |

## GUARD-024 — Faturamento não bloqueado

| Transição | TR-CAND-036 | Predicado | estado ≠ BLOQUEADO | Status | PENDING |

## GUARD-025 — Nota única candidata

| Transição | TR-CAND-040 | Invariantes | INV-011 | Status | CANDIDATE |

## GUARD-026 — Pagamento não duplicado

| Transição | TR-CAND-044 | Idempotência | IDEMPOTENCY_REQUIRED | Status | PENDING |

## GUARD-027 — Notificação canal válido

| Transição | TR-CAND-047 | Dependência | BC-015 | Status | CANDIDATE |

## GUARD-028 — Ator autorizado global

| Transição | todas com SEC | Autorização | SEC-REQ-* | Status | CANDIDATE |
