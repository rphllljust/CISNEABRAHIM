# AUTHZ-CTX-001

| Campo | Valor |
| --- | --- |
| Document ID | Regras de autorização contextual |
| Total regras | 14 (AUTHZ-029..042) — complemento funcional |
| Prompt | 08 |

> Autorização **contextual** depende de estado, vínculo, escopo ou atributo do recurso — além do papel funcional.

## AUTHZ-029 — Liberar OS somente em PREPARADA

| Campo | Valor |
| --- | --- |
| Ação | Liberar OS |
| Condição | STATE-CAND-007 PREPARADA; INV-002 |
| Papel | ROLE-CAND-002 |
| Transição | TR-CAND-007 |
| Rejeição | REJ-002 |
| Status | CANDIDATE |

## AUTHZ-030 — Executor só em OS atribuída/liberada

| Ação | Iniciar execução |
| Condição | ASSIGNED_RECORD ou PRED-003; OS LIBERADA/EM_EXECUCAO |
| Papel | ROLE-CAND-004 |
| Status | CANDIDATE |

## AUTHZ-031 — Responsável só na OS atribuída a si

| Ação | Confirmar recebimento, visualizar detalhe |
| Escopo | ASSIGNED_RECORD |
| Dados ocultos | Custo, margem (AUTHZ-015/016) |
| DDP | DDP-032 |
| Status | AMBIGUOUS |

## AUTHZ-032 — Alterar preço após liberação

| Ação | Alterar preço |
| Condição | OS STATE-CAND-008+ ; autorização adicional |
| SEC-REQ | SEC-REQ-007 |
| SOD | SOD-006 |
| Status | PENDING_BUSINESS_DECISION |

## AUTHZ-033 — Adicional em execução

| Ação | Registrar progresso com adicional |
| Condição | EM_EXECUCAO; aprovação candidata |
| SEC-REQ | SEC-REQ-008 |
| Status | PENDING_BUSINESS_DECISION |

## AUTHZ-034 — Medição após OS concluída

| Condição | GUARD-015; XLC-002 |
| Papel submeter | ROLE-CAND-007 |
| Status | CANDIDATE |

## AUTHZ-035 — Decidir medição distinto de submeter

| Condição | Mesmo ator ≠ submissor (SOD-004) |
| SEC-REQ | SEC-REQ-005 |
| Status | PENDING_BUSINESS_DECISION |

## AUTHZ-036 — Faturamento após medição aprovada

| Condição | GUARD-016; STATE-CAND-024 |
| Status | CANDIDATE |

## AUTHZ-037 — Nota com faturamento liberado

| Condição | GUARD-018; XLC-005 |
| Status | PENDING |

## AUTHZ-038 — Pagamento vinculado a nota

| Condição | INV-011; DDP-012 |
| SOD | SOD-005 |
| Status | PENDING_BUSINESS_DECISION |

## AUTHZ-039 — Documento restrito por classificação

| Condição | DOCUMENT_SCOPE; classificação candidata |
| SEC-REQ | SEC-REQ-010 |
| Status | PENDING_BUSINESS_DECISION |

## AUTHZ-040 — Isolamento cliente/unidade

| Condição | CLIENT_SCOPE / UNIT_SCOPE |
| SEC-REQ | SEC-REQ-019 |
| Status | OPEN |

## AUTHZ-041 — Conta desativada

| Condição | Identidade inativa — nega todas as ações |
| Cenário | TSC-AUTH-006 |
| Status | CANDIDATE |

## AUTHZ-042 — Delegação expirada

| Condição | Substituto sem mandato vigente |
| Referência | delegation-and-substitution-analysis |
| Status | PENDING — ADP-003 |

## Separação funcional vs contextual

| Tipo | Pergunta respondida |
| --- | --- |
| Funcional | O papel pode, em tese, executar CMD-X? |
| Contextual | Neste recurso, neste estado, com este vínculo, agora? |

Ambas devem passar — falha em qualquer uma → DENY-*.
