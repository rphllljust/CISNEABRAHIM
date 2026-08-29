# DBND-SUBD-001

| Campo       | Valor                        |
| ----------- | ---------------------------- |
| Document ID | Classificação de subdomínios |
| Fonte       | SRC-001                      |
| Total       | 12 (SUBD-001..SUBD-012)      |
| Prompt      | 05                           |

> Subdomínios pertencem ao **PROBLEM_SPACE**. Classificação **candidata** — não definitiva.

---

## SUBD-001 — Demanda e intake de serviço

| Campo                     | Valor                                                |
| ------------------------- | ---------------------------------------------------- |
| Problema                  | Capturar e decidir demandas antes da OS              |
| Capacidades               | CAP-007                                              |
| Diferenciação empresarial | Ponto de entrada do controle (EV-005, EV-027)        |
| Complexidade              | MEDIUM — fluxo e canais (WhatsApp) pendentes         |
| Risco                     | RISK-004 (duplicidade), RISK-007 (autorização)       |
| Fontes / EV               | SRC-001; EV-027, EV-028, EV-030                      |
| Regras                    | BR-001, BR-004, BR-005, BR-024                       |
| Linguagem                 | TERM-001, TERM-005, TERM-046                         |
| Stakeholders              | Solicitante, operacional (candidatos)                |
| Dependências              | SUBD-005 (cliente/comercial), SUBD-008 (autorização) |
| Confiança                 | MEDIUM                                               |
| Classificação candidata   | **CORE_CANDIDATE**                                   |

## SUBD-002 — Operação de Ordem de Serviço

| Campo                     | Valor                                            |
| ------------------------- | ------------------------------------------------ |
| Problema                  | Planejar, liberar e governar ciclo de vida da OS |
| Capacidades               | CAP-008, CAP-022                                 |
| Diferenciação empresarial | Unidade central operacional (SRC-001 §4–7)       |
| Complexidade              | HIGH — estados, tipos, liberação pendentes       |
| Risco                     | RISK-003, RISK-022                               |
| Fontes / EV               | EV-036, EV-039, EV-045, EV-084                   |
| Regras                    | BR-006, BR-007, BR-019, BR-025                   |
| Linguagem                 | TERM-002, TERM-008, TERM-010, TERM-044           |
| Stakeholders              | Operacional, autorizador                         |
| Dependências              | SUBD-001, SUBD-003, SUBD-005, SUBD-008           |
| Confiança                 | MEDIUM                                           |
| Classificação candidata   | **CORE_CANDIDATE**                               |

## SUBD-003 — Recursos, frota e alocação

| Campo                     | Valor                                                  |
| ------------------------- | ------------------------------------------------------ |
| Problema                  | Planejar e alocar mão de obra, equipamentos e veículos |
| Capacidades               | CAP-009..CAP-013                                       |
| Diferenciação empresarial | Suporte à execução; conflito de alocação (EV-053)      |
| Complexidade              | MEDIUM — taxonomia labor/equipment TBD                 |
| Risco                     | RISK-006                                               |
| Fontes / EV               | EV-049..EV-054                                         |
| Regras                    | BR-011, BR-012, BR-017                                 |
| Linguagem                 | TERM-025..030                                          |
| Stakeholders              | Operacional, executor                                  |
| Dependências              | SUBD-002                                               |
| Confiança                 | MEDIUM                                                 |
| Classificação candidata   | **SUPPORTING_CANDIDATE**                               |

## SUBD-004 — Execução e evidência de campo

| Campo                     | Valor                                       |
| ------------------------- | ------------------------------------------- |
| Problema                  | Registrar execução real e provas do serviço |
| Capacidades               | CAP-014, CAP-015                            |
| Diferenciação empresarial | Liga planejado (OS) ao realizado            |
| Complexidade              | MEDIUM — adicionais, offline pendentes      |
| Risco                     | RISK-019                                    |
| Fontes / EV               | EV-044..EV-046, EV-067                      |
| Regras                    | BR-006, BR-024                              |
| Linguagem                 | TERM-006, TERM-024, TERM-034                |
| Stakeholders              | Executor                                    |
| Dependências              | SUBD-002, SUBD-003, SUBD-007                |
| Confiança                 | MEDIUM                                      |
| Classificação candidata   | **CORE_CANDIDATE**                          |

## SUBD-005 — Relações comerciais e condições

| Campo                     | Valor                                                      |
| ------------------------- | ---------------------------------------------------------- |
| Problema                  | Vincular OS a cliente, contrato, proposta, PO, preço/custo |
| Capacidades               | CAP-002..006, CAP-027                                      |
| Diferenciação empresarial | Condições comerciais e margem (EV-058..061)                |
| Complexidade              | HIGH — cardinalidade e SoT externos                        |
| Risco                     | RISK-009, RISK-020                                         |
| Fontes / EV               | EV-055, EV-056, EV-059, EV-060                             |
| Regras                    | BR-002, BR-008, BR-013, BR-018                             |
| Linguagem                 | TERM-004, TERM-011..015, TERM-020..022                     |
| Stakeholders              | Comercial, financeiro                                      |
| Dependências              | SUBD-009 (integração ERP)                                  |
| Confiança                 | MEDIUM                                                     |
| Classificação candidata   | **SUPPORTING_CANDIDATE**                                   |

## SUBD-006 — Medição, faturamento e recebíveis

| Campo                     | Valor                                                              |
| ------------------------- | ------------------------------------------------------------------ |
| Problema                  | Medir serviço executado e registrar efeitos financeiros candidatos |
| Capacidades               | CAP-016..019                                                       |
| Diferenciação empresarial | Encadeamento medição→cobrança (EV-062, EV-074)                     |
| Complexidade              | HIGH — entidade medição, fiscal, pagamento SoT                     |
| Risco                     | RISK-005, RISK-004                                                 |
| Fontes / EV               | EV-062..EV-066                                                     |
| Regras                    | BR-009, BR-010, BR-014, BR-015                                     |
| Linguagem                 | TERM-016..019, TERM-040, TERM-041                                  |
| Stakeholders              | Financeiro, medição                                                |
| Dependências              | SUBD-004, SUBD-005                                                 |
| Confiança                 | LOW–MEDIUM                                                         |
| Classificação candidata   | **CORE_CANDIDATE**                                                 |

## SUBD-007 — Gestão documental

| Campo                     | Valor                                                |
| ------------------------- | ---------------------------------------------------- |
| Problema                  | Documentos lógicos, versões e arquivos com histórico |
| Capacidades               | CAP-020                                              |
| Diferenciação empresarial | Substituição controlada (EV-082)                     |
| Complexidade              | MEDIUM                                               |
| Risco                     | RISK-008                                             |
| Fontes / EV               | EV-067..070, EV-082                                  |
| Regras                    | BR-016, BR-020                                       |
| Linguagem                 | TERM-031..033, TERM-043                              |
| Stakeholders              | Responsável documental                               |
| Dependências              | Transversal a SUBD-002, SUBD-004, SUBD-006           |
| Confiança                 | MEDIUM                                               |
| Classificação candidata   | **SUPPORTING_CANDIDATE**                             |

## SUBD-008 — Identidade, autorização e auditoria

| Campo                     | Valor                                     |
| ------------------------- | ----------------------------------------- |
| Problema                  | Quem pode fazer o quê; trilha empresarial |
| Capacidades               | CAP-001, CAP-024                          |
| Diferenciação empresarial | Baixa — necessidade transversal           |
| Complexidade              | MEDIUM — SoD, papéis pendentes            |
| Risco                     | RISK-007, RISK-013, RISK-024              |
| Fontes / EV               | EV-078, EV-079                            |
| Regras                    | BR-023                                    |
| Linguagem                 | TERM-007; NFR-029                         |
| Stakeholders              | Direção, auditoria                        |
| Dependências              | Transversal                               |
| Confiança                 | LOW                                       |
| Classificação candidata   | **GENERIC_CANDIDATE**                     |

## SUBD-009 — Integração e verdade externa

| Campo                     | Valor                                   |
| ------------------------- | --------------------------------------- |
| Problema                  | Sincronizar referências sem assumir SoT |
| Capacidades               | CAP-025                                 |
| Diferenciação empresarial | Habilitador, não core operacional       |
| Complexidade              | HIGH — contratos ausentes               |
| Risco                     | RISK-010                                |
| Fontes / EV               | EV-077                                  |
| Regras                    | BR-005                                  |
| Linguagem                 | TERM-037, TERM-048                      |
| Stakeholders              | TI, comercial                           |
| Dependências              | SUBD-005, SUBD-006                      |
| Confiança                 | LOW                                     |
| Classificação candidata   | **SUPPORTING_CANDIDATE**                |

## SUBD-010 — Relatórios e inteligência operacional

| Campo                     | Valor                                |
| ------------------------- | ------------------------------------ |
| Problema                  | Consultas agregadas, aging, gargalos |
| Capacidades               | CAP-023                              |
| Diferenciação empresarial | Baixa — commodity analítica          |
| Complexidade              | LOW — faixas não definidas           |
| Risco                     | —                                    |
| Fontes / EV               | EV-074..076                          |
| Regras                    | BR-022                               |
| Linguagem                 | TERM-039                             |
| Stakeholders              | Direção                              |
| Dependências              | Leitura de todos os subdomínios core |
| Confiança                 | LOW                                  |
| Classificação candidata   | **GENERIC_CANDIDATE**                |

## SUBD-011 — Notificação e comunicação

| Campo                     | Valor                                    |
| ------------------------- | ---------------------------------------- |
| Problema                  | Informar atores sobre eventos relevantes |
| Capacidades               | CAP-021                                  |
| Diferenciação empresarial | Baixa                                    |
| Complexidade              | LOW — WhatsApp CAPABILITY_ONLY           |
| Risco                     | —                                        |
| Fontes / EV               | EV-077                                   |
| Regras                    | BR-005                                   |
| Linguagem                 | TERM-036                                 |
| Stakeholders              | Operacional                              |
| Dependências              | Eventos de outros subdomínios            |
| Confiança                 | LOW                                      |
| Classificação candidata   | **GENERIC_CANDIDATE**                    |

## SUBD-012 — Continuidade e recuperação

| Campo                     | Valor                          |
| ------------------------- | ------------------------------ |
| Problema                  | Preservar operação ante falhas |
| Capacidades               | CAP-026                        |
| Diferenciação empresarial | Nenhuma — infraestrutura       |
| Complexidade              | UNKNOWN — RPO/RTO pendentes    |
| Risco                     | RISK-011                       |
| Fontes / EV               | EV-083                         |
| Regras                    | —                              |
| Linguagem                 | —                              |
| Stakeholders              | TI                             |
| Dependências              | Transversal                    |
| Confiança                 | LOW                            |
| Classificação candidata   | **GENERIC_CANDIDATE**          |

## Resumo por classificação

| Classificação        | SUBDs              |
| -------------------- | ------------------ |
| CORE_CANDIDATE       | 001, 002, 004, 006 |
| SUPPORTING_CANDIDATE | 003, 005, 007, 009 |
| GENERIC_CANDIDATE    | 008, 010, 011, 012 |
| UNCLASSIFIED         | 0                  |
