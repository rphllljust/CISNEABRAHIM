# SM-TR-REG-001

| Campo       | Valor                             |
| ----------- | --------------------------------- |
| Document ID | Registro de transições candidatas |
| Total       | 48 (TR-CAND-001..048)             |
| Prompt      | 07                                |

> Transição sem evidência: `PENDING_SOURCE_VALIDATION`.

## SERVICE_REQUEST (SM-CAND-001)

### TR-CAND-001

| Campo       | Valor                     |
| ----------- | ------------------------- |
| Máquina     | SM-CAND-001               |
| Origem      | STATE-CAND-001 REGISTRADA |
| Destino     | STATE-CAND-002 EM_ANALISE |
| Comando     | CMD-002                   |
| Ator        | Decisor candidato         |
| Guardas     | GUARD-001                 |
| Invariantes | INV-001                   |
| Eventos     | DE-002 (PENDING)          |
| Status      | PENDING_BUSINESS_DECISION |

### TR-CAND-002

| Origem | REGISTRADA | Destino | APROVADA | Comando | CMD-002 | Guardas | GUARD-002 | Status | PENDING |

### TR-CAND-003

| Origem | REGISTRADA/EM_ANALISE | Destino | REJEITADA | Comando | CMD-002 | Guardas | GUARD-003 | Status | PENDING |

### TR-CAND-004

| Origem | APROVADA | Destino | (vínculo OS) | Comando | CMD-003 | Guardas | GUARD-004 | Eventos | DE-003 | Status | CANDIDATE |

### TR-CAND-005

| Origem | REGISTRADA/APROVADA | Destino | CANCELADA | Comando | — | Guardas | GUARD-005 | DDP | DDP-004 | Status | PENDING_BUSINESS_DECISION |

## SERVICE_ORDER (SM-CAND-002)

### TR-CAND-006

| Origem | RASCUNHO | Destino | PREPARADA | CMD | CMD-004 | INV | INV-002 parcial | DE | — | Status | CANDIDATE |

### TR-CAND-007

| Origem | PREPARADA | Destino | LIBERADA | CMD | CMD-005 | Guardas | GUARD-006, GUARD-007 | INV | INV-002 | DE | DE-004 | Rejeições | REJ-002, REJ-003 | Status | CANDIDATE |

### TR-CAND-008

| Origem | LIBERADA | Destino | LIBERADA | CMD | CMD-006 | Nota | Atribuição = evento DE-005, sem mudança estado obrigatória | Status | AMBIGUOUS |

### TR-CAND-009

| Origem | LIBERADA | Destino | EM_EXECUCAO | CMD | CMD-008 | Guardas | GUARD-008 | DE | DE-009 | Concorrência | EXCLUSIVE_RESOURCE | Status | CANDIDATE |

### TR-CAND-010

| Origem | EM_EXECUCAO | Destino | CONCLUIDA | CMD | CMD-010 | Guardas | GUARD-009 | INV | INV-006 | DE | DE-011 | Status | CANDIDATE |

### TR-CAND-011

| Origem | RASCUNHO/PREPARADA/LIBERADA/EM_EXECUCAO | Destino | CANCELADA | CMD | CMD-011 | Guardas | GUARD-010 | DE | DE-012 | DDP | DDP-004 | Status | CANDIDATE |

### TR-CAND-012

| Origem | CONCLUIDA | Destino | EM_EXECUCAO | CMD | CMD-012 | Guardas | GUARD-011 | DDP | DDP-005 | Status | PENDING_BUSINESS_DECISION |

### TR-CAND-013

| Origem | — | Destino | RASCUNHO | CMD | CMD-003 | Guardas | GUARD-004 | DE | DE-003 | Status | CANDIDATE |

### TR-CAND-014

| Origem | LIBERADA | Destino | LIBERADA | CMD | CMD-007 | Nota | ACK = timestamp/audit, não estado | Status | PENDING |

### TR-CAND-015

| Origem | qualquer não-terminal | Destino | PREPARADA | CMD | CMD-013 | Guardas | GUARD-012 | Histórico | DOMAIN_HISTORY | Status | CANDIDATE |

## ALLOCATION (SM-CAND-003)

### TR-CAND-016

| Origem | PLANEJADA | Destino | ALOCADA | CMD | CMD-015 | Guardas | GUARD-013 | DE | DE-007 | Concorrência | EXCLUSIVE_RESOURCE | Status | CANDIDATE |

### TR-CAND-017

| Origem | PLANEJADA | Destino | RESERVADA | CMD | — | Status | PENDING_SOURCE_VALIDATION |

### TR-CAND-018

| Origem | ALOCADA | Destino | SUBSTITUIDA | CMD | CMD-015 + política | Status | PENDING_SOURCE_VALIDATION |

### TR-CAND-019

| Origem | ALOCADA | Destino | LIBERADA | CMD | — | Status | PENDING_SOURCE_VALIDATION |

### TR-CAND-020

| Origem | PLANEJADA/ALOCADA | Destino | CANCELADA | CMD | — | DDP | DDP-004 | Status | PENDING |

### TR-CAND-021

| Origem | — | Destino | PLANEJADA | CMD | CMD-014 | Status | CANDIDATE |

## EXECUTION (SM-CAND-004)

### TR-CAND-022

| Origem | NAO_INICIADA | Destino | EM_ANDAMENTO | CMD | CMD-008 | Guardas | GUARD-008 | DE | DE-009 | Efeito externo | Alinha TR-CAND-009 | Status | CANDIDATE |

### TR-CAND-023

| Origem | EM_ANDAMENTO | Destino | EM_ANDAMENTO | CMD | CMD-009 | DE | DE-010 | Idempotência | UNIQUE_BUSINESS_OPERATION | Status | CANDIDATE |

### TR-CAND-024

| Origem | EM_ANDAMENTO | Destino | CONCLUIDA | CMD | CMD-010 | Guardas | GUARD-009 | DE | DE-011 | Status | CANDIDATE |

## MEASUREMENT (SM-CAND-005)

### TR-CAND-025

| Origem | RASCUNHO | Destino | SUBMETIDA | CMD | CMD-017 | DE | DE-014 | Status | CANDIDATE |

### TR-CAND-026

| Origem | SUBMETIDA | Destino | EM_ANALISE | CMD | CMD-018 | Status | PENDING |

### TR-CAND-027

| Origem | EM_ANALISE | Destino | APROVADA | CMD | CMD-018 | Guardas | GUARD-014 | DE | DE-015 | Status | PENDING |

### TR-CAND-028

| Origem | EM_ANALISE | Destino | REJEITADA | CMD | CMD-018 | Status | PENDING |

### TR-CAND-029

| Origem | REJEITADA | Destino | CORRIGIDA/RASCUNHO | CMD | — | DDP | DDP-010 | Status | PENDING_SOURCE_VALIDATION |

### TR-CAND-030

| Origem | RASCUNHO/SUBMETIDA | Destino | CANCELADA | CMD | — | DDP | DDP-004 | Status | PENDING |

### TR-CAND-031

| Origem | — | Destino | RASCUNHO | CMD | implícito pós-OS concluída | Guardas | GUARD-015 | Status | CANDIDATE |

## DOCUMENT (SM-CAND-006)

### TR-CAND-032

| Origem | RASCUNHO | Destino | VIGENTE | CMD | CMD-016 | DE | DE-013 | Status | CANDIDATE |

### TR-CAND-033

| Origem | VIGENTE | Destino | SUBSTITUIDA (versão) | CMD | CMD-022 | DE | DE-019 | Status | CANDIDATE |

### TR-CAND-034

| Origem | VIGENTE | Destino | INVALIDADA | CMD | — | DDP | DDP-004 | Status | PENDING |

### TR-CAND-035

| Origem | — | Destino | RASCUNHO | CMD | criação | Status | CANDIDATE |

## BILLING (SM-CAND-007)

### TR-CAND-036

| Origem | NAO_PREPARADO | Destino | PREPARADO | CMD | CMD-019 | Guardas | GUARD-016 | DE | DE-016 | Status | CANDIDATE |

### TR-CAND-037

| Origem | PREPARADO | Destino | BLOQUEADO | CMD | — | Status | PENDING_SOURCE_VALIDATION |

### TR-CAND-038

| Origem | BLOQUEADO/PREPARADO | Destino | LIBERADO | CMD | — | Guardas | GUARD-017 | Status | PENDING_BUSINESS_DECISION |

### TR-CAND-039

| Origem | PREPARADO | Destino | NAO_PREPARADO | CMD | — | Compensação | SDD-007 | Status | PENDING |

## INVOICE (SM-CAND-008)

### TR-CAND-040

| Origem | — | Destino | REGISTRADA | CMD | CMD-020 | Guardas | GUARD-018 | INV | INV-007, INV-011 | DE | DE-017 | Status | CANDIDATE |

### TR-CAND-041

| Origem | REGISTRADA | Destino | ENVIADA | CMD | — | Status | PENDING_SOURCE_VALIDATION |

### TR-CAND-042

| Origem | ENVIADA | Destino | RECEBIDA | CMD | — | Status | PENDING_SOURCE_VALIDATION |

### TR-CAND-043

| Origem | REGISTRADA/RECEBIDA | Destino | CANCELADA | CMD | — | DDP | DDP-004 | Status | PENDING |

## PAYMENT (SM-CAND-009)

### TR-CAND-044

| Origem | PENDENTE | Destino | RECEBIDO | CMD | CMD-021 | Guardas | GUARD-019 | DE | DE-018 | Status | PENDING_BUSINESS_DECISION |

### TR-CAND-045

| Origem | PENDENTE | Destino | PARCIAL | CMD | — | SDD | SDD-004 | Status | PENDING_BUSINESS_DECISION |

### TR-CAND-046

| Origem | RECEBIDO | Destino | ESTORNADO | CMD | — | SDD | SDD-005 | Status | PENDING_BUSINESS_DECISION |

## NOTIFICATION (SM-CAND-010)

### TR-CAND-047

| Origem | CRIADA | Destino | PENDENTE → ENVIADA → ENTREGUE | CMD | canal | Nota | Cadeia multi-hop | Status | CANDIDATE |

### TR-CAND-048

| Origem | PENDENTE/ENVIADA | Destino | FALHOU/DESCARTADA | CMD | — | Retry | SDD-006 | Status | CANDIDATE |
