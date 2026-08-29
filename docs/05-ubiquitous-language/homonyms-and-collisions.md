# UL-HOM-001

| Campo       | Valor                |
| ----------- | -------------------- |
| Document ID | Homônimos e colisões |
| Prompt      | 04                   |

| Colisão                | Termos                                  | Risco                           | Mitigação                                       |
| ---------------------- | --------------------------------------- | ------------------------------- | ----------------------------------------------- |
| Ordem                  | TERM-002 (OS) vs TERM-013 (PO)          | Confusão PT/EN                  | Usar siglas OS e PO explicitamente              |
| Pedido                 | TERM-001 vs TERM-012                    | Solicitação vs pedido comercial | Qualificar com TERM-ID                          |
| Documento              | TERM-031 vs TERM-018 vs TERM-035        | Tipos documentais distintos     | Qualificar domínio                              |
| Evidência              | EV-* (registro atômico) vs TERM-034/035 | Metamodelo vs negócio           | EV-* só em análise de fonte                     |
| Versão                 | TERM-032 vs TERM-009                    | Documento vs OS rascunho        | Nunca "versão" sem contexto                     |
| Recurso                | TERM-029 vs recurso de TI               | Ambiguidade técnica             | "Recurso operacional"                           |
| Nota                   | TERM-018 vs nota fiscal genérica        | Fiscal vs informado             | Sempre "documento de faturamento informado"     |
| Responsável            | TERM-008 vs TERM-006                    | Accountable vs executor         | Definições separadas                            |
| Liberação vs Conversão | TERM-010 vs TERM-045                    | Fluxo OS                        | Sequência documentada em service-order-language |
| Gestão                 | EV-080                                  | Ator não nomeado                | Não usar como termo preferencial                |

## Normalizações críticas (Prompt 04 §8)

| Distinção                           | Status documental | TERM / nota                                  |
| ----------------------------------- | ----------------- | -------------------------------------------- |
| SERVICE_REQUEST ≠ SERVICE_ORDER     | Documentada       | TERM-001 ≠ TERM-002                          |
| CUSTOMER_ORDER ≠ SERVICE_ORDER      | Candidata         | TERM-012 ≠ TERM-002                          |
| EQUIPMENT_TYPE ≠ PHYSICAL_ASSET     | Candidata         | TERM-025; ativo físico não distinto na fonte |
| LABOR_TYPE ≠ PERSON                 | Candidata         | TERM-028 vs papéis DDP-006                   |
| PLANNED ≠ AUTHORIZED                | Candidata         | TERM-023 vs liberação TERM-010               |
| AUTHORIZED ≠ ALLOCATED              | Candidata         | TERM-010 vs TERM-030                         |
| ALLOCATED ≠ ACTUAL                  | Documentada       | TERM-030 vs TERM-024                         |
| ACTUAL ≠ MEASURED                   | Candidata         | TERM-024 vs TERM-016                         |
| MEASURED ≠ INVOICED                 | Candidata         | TERM-016 vs TERM-017                         |
| INVOICED ≠ PAID                     | Candidata         | TERM-017 vs TERM-019; DDP-012                |
| INTERNAL_COST ≠ COMMERCIAL_PRICE    | Documentada       | TERM-020 vs TERM-021                         |
| LOGICAL_DOCUMENT ≠ DOCUMENT_VERSION | Documentada       | TERM-031 vs TERM-032                         |
| DOCUMENT_VERSION ≠ BINARY_FILE      | Documentada       | TERM-032 vs TERM-033                         |
| DOMAIN_HISTORY ≠ AUDIT_TRAIL        | Documentada       | TERM-044; NFR-006 vs NFR-029                 |
| AUDIT_TRAIL ≠ TECHNICAL_LOG         | Documentada       | NFR-029 vs NFR-039                           |
| VIEWED ≠ ACKNOWLEDGED               | Candidata         | DDP-032                                      |
| ACKNOWLEDGED ≠ ACCEPTED             | Candidata         | DDP-032                                      |

"Candidata" = distinção registrada; validação empresarial pendente.
