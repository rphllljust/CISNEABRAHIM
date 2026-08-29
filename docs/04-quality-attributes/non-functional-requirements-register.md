# QATTR-NFR-REG-001

| Campo            | Valor                                           |
| ---------------- | ----------------------------------------------- |
| Document ID      | Registro de requisitos não funcionais           |
| Fonte            | SRC-001                                         |
| Total NFRs       | 40 (NFR-001..NFR-040)                           |
| Status dominante | PENDING_SOURCE_VALIDATION / PENDING_MEASUREMENT |
| CONFIRMED        | 0                                               |
| Prompt           | 03                                              |

> Nenhuma meta numérica inventada. Targets não definidos: `TARGET_NOT_DEFINED`. Medição: `MEASUREMENT_METHOD_PENDING`.

## Índice por categoria

| Categoria                      | NFRs                      |
| ------------------------------ | ------------------------- |
| Integridade e concorrência     | NFR-001..NFR-005          |
| Auditoria e accountability     | NFR-006, NFR-029, NFR-030 |
| Segurança empresarial e acesso | NFR-007..NFR-022          |
| Confiabilidade e recuperação   | NFR-023..NFR-028          |
| Observabilidade                | NFR-029..NFR-031          |
| Performance e capacidade       | NFR-032..NFR-035          |
| Privacidade e retenção         | NFR-036..NFR-039          |
| Manutenibilidade               | NFR-040                   |

---

## NFR-001 — Impedir sobrescrita silenciosa de informação empresarial

| Campo                        | Valor                                                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-001                                                                                                                                                                                               |
| Título                       | Impedir sobrescrita silenciosa de informação empresarial                                                                                                                                              |
| Declaração normativa         | Quando duas alterações concorrentes afetarem o mesmo artefato empresarial relevante, o sistema deverá impedir sobrescrita silenciosa e produzir resultado determinístico conforme política a definir. |
| Categoria                    | INTEGRITY / CONCURRENCY                                                                                                                                                                               |
| Fonte                        | SRC-001                                                                                                                                                                                               |
| Evidências                   | EV-079, EV-036                                                                                                                                                                                        |
| BRs / FRs                    | BR-019; FR-022; EX-017                                                                                                                                                                                |
| Risco                        | RISK-003                                                                                                                                                                                              |
| Criticidade                  | HIGH                                                                                                                                                                                                  |
| Escopo                       | GLOBAL                                                                                                                                                                                                |
| Estímulo                     | Duas pessoas alteram a mesma OS ou registro vinculado simultaneamente                                                                                                                                 |
| Ambiente                     | Operação normal com múltiplos atores                                                                                                                                                                  |
| Artefato afetado             | Ordem de Serviço e entidades vinculadas                                                                                                                                                               |
| Resposta esperada            | Detecção de conflito; preservação de histórico; sem perda silenciosa                                                                                                                                  |
| Medida da resposta           | Taxa de lost update em cenários de teste futuro                                                                                                                                                       |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                                                                                                    |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                                                                                            |
| Owner                        | UNKNOWN                                                                                                                                                                                               |
| DDPs                         | DDP-037                                                                                                                                                                                               |
| Status                       | PENDING_MEASUREMENT                                                                                                                                                                                   |
| Critérios de validação       | QA-SC-001; cenário de concorrência documentado sem escolha de mecanismo                                                                                                                               |

## NFR-002 — Idempotência na criação de solicitação

| Campo                        | Valor                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-002                                                                                                                                            |
| Título                       | Idempotência na criação de solicitação                                                                                                             |
| Declaração normativa         | Quando a mesma intenção de registro de solicitação for reenviada, o sistema deverá evitar duplicidade não autorizada de solicitações equivalentes. |
| Categoria                    | INTEGRITY / IDEMPOTENCY                                                                                                                            |
| Fonte                        | SRC-001                                                                                                                                            |
| Evidências                   | EV-027, EV-005                                                                                                                                     |
| BRs / FRs                    | BR-004; FR-001; EX-001, EX-014                                                                                                                     |
| Risco                        | RISK-004                                                                                                                                           |
| Criticidade                  | HIGH                                                                                                                                               |
| Escopo                       | SERVICE_REQUEST                                                                                                                                    |
| Estímulo                     | Reenvio de comando de registro                                                                                                                     |
| Ambiente                     | Canal instável ou duplo clique                                                                                                                     |
| Artefato afetado             | Solicitação de serviço                                                                                                                             |
| Resposta esperada            | Uma solicitação lógica ou sinalização explícita de duplicidade                                                                                     |
| Medida da resposta           | Contagem de duplicatas não intencionais em teste futuro                                                                                            |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                                                 |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                                         |
| Owner                        | UNKNOWN                                                                                                                                            |
| DDPs                         | DDP-037                                                                                                                                            |
| Status                       | PENDING_SOURCE_VALIDATION                                                                                                                          |
| Critérios de validação       | QA-SC-002                                                                                                                                          |

## NFR-003 — Idempotência na conversão solicitação → OS

| Campo                        | Valor                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-003                                                                                                                                               |
| Título                       | Idempotência na conversão solicitação → OS                                                                                                            |
| Declaração normativa         | Quando a conversão de solicitação em OS for reexecutada, o sistema deverá impedir múltiplas OS originadas da mesma solicitação sem decisão explícita. |
| Categoria                    | INTEGRITY / IDEMPOTENCY                                                                                                                               |
| Fonte                        | SRC-001                                                                                                                                               |
| Evidências                   | EV-028, EV-034                                                                                                                                        |
| BRs / FRs                    | BR-001; FR-008, FR-009; EX-002                                                                                                                        |
| Risco                        | RISK-004                                                                                                                                              |
| Criticidade                  | CRITICAL                                                                                                                                              |
| Escopo                       | SERVICE_REQUEST, SERVICE_ORDER                                                                                                                        |
| Estímulo                     | Reenvio de conversão                                                                                                                                  |
| Ambiente                     | Operação com autorização candidata                                                                                                                    |
| Artefato afetado             | Solicitação; OS                                                                                                                                       |
| Resposta esperada            | Uma OS por solicitação ou bloqueio determinístico                                                                                                     |
| Medida da resposta           | Zero conversões duplicadas em cenário de teste                                                                                                        |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                                                    |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                                            |
| Owner                        | UNKNOWN                                                                                                                                               |
| DDPs                         | DDP-002, DDP-037                                                                                                                                      |
| Status                       | PENDING_SOURCE_VALIDATION                                                                                                                             |
| Critérios de validação       | QA-SC-003                                                                                                                                             |

## NFR-004 — Integridade da liberação de OS

| Campo                        | Valor                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-004                                                                                                                                               |
| Título                       | Integridade da liberação de OS                                                                                                                        |
| Declaração normativa         | O sistema deverá garantir que liberação de OS não ocorra sem elegibilidade e autorização empresarial candidatas, sem estado inconsistente observável. |
| Categoria                    | INTEGRITY / AUTHORIZATION                                                                                                                             |
| Fonte                        | SRC-001                                                                                                                                               |
| Evidências                   | EV-036, EV-039, EV-013                                                                                                                                |
| BRs / FRs                    | BR-006; FR-014; VR-004, VR-005                                                                                                                        |
| Risco                        | RISK-022                                                                                                                                              |
| Criticidade                  | CRITICAL                                                                                                                                              |
| Escopo                       | SERVICE_ORDER                                                                                                                                         |
| Estímulo                     | Tentativa de liberação                                                                                                                                |
| Ambiente                     | Preparação concluída ou não                                                                                                                           |
| Artefato afetado             | Ordem de Serviço                                                                                                                                      |
| Resposta esperada            | Liberação somente quando regras futuras permitirem                                                                                                    |
| Medida da resposta           | Taxa de liberações inválidas em auditoria futura                                                                                                      |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                                                    |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                                            |
| Owner                        | UNKNOWN                                                                                                                                               |
| DDPs                         | DDP-003, DDP-029                                                                                                                                      |
| Status                       | PENDING_BUSINESS_DECISION                                                                                                                             |
| Critérios de validação       | QA-SC-004                                                                                                                                             |

## NFR-005 — Detecção de conflito de alocação de recurso

| Campo                        | Valor                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-005                                                                                                                                      |
| Título                       | Detecção de conflito de alocação de recurso                                                                                                  |
| Declaração normativa         | Quando o mesmo recurso candidato for alocado simultaneamente a operações incompatíveis, o sistema deverá sinalizar conflito conforme FR-028. |
| Categoria                    | INTEGRITY / CONCURRENCY                                                                                                                      |
| Fonte                        | SRC-001                                                                                                                                      |
| Evidências                   | EV-053, EV-051                                                                                                                               |
| BRs / FRs                    | BR-017; FR-025, FR-028                                                                                                                       |
| Risco                        | RISK-006                                                                                                                                     |
| Criticidade                  | HIGH                                                                                                                                         |
| Escopo                       | RESOURCE_ALLOCATION                                                                                                                          |
| Estímulo                     | Alocação concorrente                                                                                                                         |
| Ambiente                     | Múltiplas OS ativas                                                                                                                          |
| Artefato afetado             | Alocação de recurso                                                                                                                          |
| Resposta esperada            | Sinalização de conflito; sem alocação silenciosa dupla                                                                                       |
| Medida da resposta           | Conflitos detectados vs não detectados em teste                                                                                              |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                                           |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                                   |
| Owner                        | UNKNOWN                                                                                                                                      |
| DDPs                         | DDP-007                                                                                                                                      |
| Status                       | PENDING_SOURCE_VALIDATION                                                                                                                    |
| Critérios de validação       | QA-SC-005                                                                                                                                    |

## NFR-006 — Preservação de histórico empresarial da OS

| Campo                        | Valor                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-006                                                                                                              |
| Título                       | Preservação de histórico empresarial da OS                                                                           |
| Declaração normativa         | O sistema deverá preservar histórico de alterações relevantes da OS de forma consultável para auditoria empresarial. |
| Categoria                    | AUDITABILITY                                                                                                         |
| Fonte                        | SRC-001                                                                                                              |
| Evidências                   | EV-078, EV-079                                                                                                       |
| BRs / FRs                    | BR-019; FR-022; DR-023                                                                                               |
| Risco                        | RISK-008                                                                                                             |
| Criticidade                  | HIGH                                                                                                                 |
| Escopo                       | SERVICE_ORDER                                                                                                        |
| Estímulo                     | Alteração de conteúdo ou estado                                                                                      |
| Ambiente                     | Operação normal                                                                                                      |
| Artefato afetado             | Histórico da OS                                                                                                      |
| Resposta esperada            | Registro de alteração com contexto mínimo a definir                                                                  |
| Medida da resposta           | Completude do histórico em revisão de auditoria                                                                      |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                   |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                           |
| Owner                        | UNKNOWN                                                                                                              |
| DDPs                         | DDP-015                                                                                                              |
| Status                       | PENDING_SOURCE_VALIDATION                                                                                            |
| Critérios de validação       | QA-SC-006; separação AUDIT_TRAIL vs TECHNICAL_LOG                                                                    |

## NFR-007 — Enforcement de autorização empresarial

| Campo                        | Valor                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID                           | NFR-007                                                                                                                                                |
| Título                       | Enforcement de autorização empresarial                                                                                                                 |
| Declaração normativa         | Ações empresariais sensíveis deverão ser permitidas somente a atores autorizados conforme regras candidatas, independentemente da interface utilizada. |
| Categoria                    | SECURITY / AUTHORIZATION                                                                                                                               |
| Fonte                        | SRC-001                                                                                                                                                |
| Evidências                   | EV-033, EV-036                                                                                                                                         |
| BRs / FRs                    | AUTH-REQ-002..020; FR-006, FR-014, FR-032                                                                                                              |
| Risco                        | RISK-007, RISK-013                                                                                                                                     |
| Criticidade                  | CRITICAL                                                                                                                                               |
| Escopo                       | GLOBAL                                                                                                                                                 |
| Estímulo                     | Tentativa de ação sem alçada                                                                                                                           |
| Ambiente                     | Qualquer canal                                                                                                                                         |
| Artefato afetado             | Operações autorizadas                                                                                                                                  |
| Resposta esperada            | Bloqueio ou registro de tentativa conforme política                                                                                                    |
| Medida da resposta           | Taxa de ações não autorizadas bem-sucedidas                                                                                                            |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                                                     |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                                             |
| Owner                        | UNKNOWN                                                                                                                                                |
| DDPs                         | DDP-015                                                                                                                                                |
| Status                       | PENDING_BUSINESS_DECISION                                                                                                                              |
| Critérios de validação       | QA-SC-007; SEC-REQ-001..008                                                                                                                            |

## NFR-008 — Restrição de visualização de custo e margem

| Campo                        | Valor                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-008                                                                                                          |
| Título                       | Restrição de visualização de custo e margem                                                                      |
| Declaração normativa         | Dados de custo interno e margem candidatos deverão ser acessíveis somente a atores autorizados empresarialmente. |
| Categoria                    | SECURITY / DATA_PROTECTION                                                                                       |
| Fonte                        | SRC-001                                                                                                          |
| Evidências                   | EV-061, EV-078                                                                                                   |
| BRs / FRs                    | BR-018; FR-032; DR-015                                                                                           |
| Risco                        | RISK-020                                                                                                         |
| Criticidade                  | HIGH                                                                                                             |
| Escopo                       | PRICING                                                                                                          |
| Estímulo                     | Consulta de custo/margem                                                                                         |
| Ambiente                     | Operação e relatórios                                                                                            |
| Artefato afetado             | Valores restritos                                                                                                |
| Resposta esperada            | Ocultação ou negação para não autorizados                                                                        |
| Medida da resposta           | Vazamentos em teste de autorização futuro                                                                        |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                               |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                       |
| Owner                        | UNKNOWN                                                                                                          |
| DDPs                         | DDP-030                                                                                                          |
| Status                       | PENDING_BUSINESS_DECISION                                                                                        |
| Critérios de validação       | QA-SC-008; SEC-REQ-009                                                                                           |

## NFR-009 — Preservação de versões documentais

| Campo                        | Valor                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-009                                                                                                                      |
| Título                       | Preservação de versões documentais                                                                                           |
| Declaração normativa         | Substituição documental não deverá apagar silenciosamente versões anteriores quando política de retenção exigir preservação. |
| Categoria                    | INTEGRITY / DOCUMENT                                                                                                         |
| Fonte                        | SRC-001                                                                                                                      |
| Evidências                   | EV-082, EV-068, EV-069                                                                                                       |
| BRs / FRs                    | BR-016; FR-041, FR-042; VR-012                                                                                               |
| Risco                        | RISK-008                                                                                                                     |
| Criticidade                  | HIGH                                                                                                                         |
| Escopo                       | DOCUMENT                                                                                                                     |
| Estímulo                     | Substituição de documento                                                                                                    |
| Ambiente                     | Gestão documental                                                                                                            |
| Artefato afetado             | Versões documentais                                                                                                          |
| Resposta esperada            | Versão anterior preservada ou conflito explícito                                                                             |
| Medida da resposta           | Integridade de versões em auditoria                                                                                          |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                           |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                   |
| Owner                        | UNKNOWN                                                                                                                      |
| DDPs                         | DDP-013, DDP-033                                                                                                             |
| Status                       | PENDING_SOURCE_VALIDATION                                                                                                    |
| Critérios de validação       | QA-SC-009                                                                                                                    |

## NFR-010 — Controle de acesso a documentos restritos

| Campo                        | Valor                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| ID                           | NFR-010                                                                                              |
| Título                       | Controle de acesso a documentos restritos                                                            |
| Declaração normativa         | Documentos classificados como restritos candidatos deverão ter acesso limitado a atores autorizados. |
| Categoria                    | SECURITY / DOCUMENT                                                                                  |
| Fonte                        | SRC-001                                                                                              |
| Evidências                   | EV-021, EV-080                                                                                       |
| BRs / FRs                    | FR-042; DOC-REQ-005                                                                                  |
| Risco                        | RISK-007                                                                                             |
| Criticidade                  | HIGH                                                                                                 |
| Escopo                       | DOCUMENT                                                                                             |
| Estímulo                     | Download ou visualização                                                                             |
| Ambiente                     | Operação e arquivo                                                                                   |
| Artefato afetado             | Documento lógico / arquivo                                                                           |
| Resposta esperada            | Acesso negado ou registrado para não autorizados                                                     |
| Medida da resposta           | Tentativas indevidas detectadas                                                                      |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                   |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                           |
| Owner                        | UNKNOWN                                                                                              |
| DDPs                         | DDP-033                                                                                              |
| Status                       | PENDING_BUSINESS_DECISION                                                                            |
| Critérios de validação       | QA-SC-010; SEC-REQ-010                                                                               |

## NFR-011 — Rastreabilidade de origem faturável

| Campo                        | Valor                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| ID                           | NFR-011                                                                                                |
| Título                       | Rastreabilidade de origem faturável                                                                    |
| Declaração normativa         | Preparação de cobrança candidata deverá exigir origem identificável quando regra preliminar aplicável. |
| Categoria                    | INTEGRITY / FINANCIAL                                                                                  |
| Fonte                        | SRC-001                                                                                                |
| Evidências                   | EV-017, EV-058, EV-062                                                                                 |
| BRs / FRs                    | BR-014; FR-038; VR-011                                                                                 |
| Risco                        | RISK-005                                                                                               |
| Criticidade                  | CRITICAL                                                                                               |
| Escopo                       | BILLING                                                                                                |
| Estímulo                     | Preparação de item faturável                                                                           |
| Ambiente                     | Fluxo comercial                                                                                        |
| Artefato afetado             | Item faturável                                                                                         |
| Resposta esperada            | Bloqueio ou sinalização de origem ausente                                                              |
| Medida da resposta           | Itens sem origem em auditoria                                                                          |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                     |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                             |
| Owner                        | UNKNOWN                                                                                                |
| DDPs                         | DDP-010, DDP-011                                                                                       |
| Status                       | PENDING_SOURCE_VALIDATION                                                                              |
| Critérios de validação       | QA-SC-011                                                                                              |

## NFR-012 — Transparência em falha de integração externa

| Campo                        | Valor                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------- |
| ID                           | NFR-012                                                                      |
| Título                       | Transparência em falha de integração externa                                 |
| Declaração normativa         | Falha de sistema externo não deverá ser registrada como sucesso local falso. |
| Categoria                    | RELIABILITY / INTEGRATION                                                    |
| Fonte                        | SRC-001                                                                      |
| Evidências                   | EV-077                                                                       |
| BRs / FRs                    | FR-030; VR-021; INT-REQ-001..008                                             |
| Risco                        | RISK-010                                                                     |
| Criticidade                  | HIGH                                                                         |
| Escopo                       | INTEGRATION                                                                  |
| Estímulo                     | Indisponibilidade ou erro externo                                            |
| Ambiente                     | Integração candidata                                                         |
| Artefato afetado             | Sincronização comercial/fiscal                                               |
| Resposta esperada            | Estado local honesto; reconciliação candidata                                |
| Medida da resposta           | Inconsistências não detectadas                                               |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                           |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                   |
| Owner                        | UNKNOWN                                                                      |
| DDPs                         | DDP-014, DDP-020                                                             |
| Status                       | PENDING_SOURCE_VALIDATION                                                    |
| Critérios de validação       | QA-SC-012                                                                    |

## NFR-013 — Integridade de decisão sobre medição

| Campo                        | Valor                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| ID                           | NFR-013                                                                                       |
| Título                       | Integridade de decisão sobre medição                                                          |
| Declaração normativa         | Decisão sobre medição deverá respeitar segregação candidata entre quem prepara e quem decide. |
| Categoria                    | INTEGRITY / AUTHORIZATION                                                                     |
| Fonte                        | SRC-001                                                                                       |
| Evidências                   | EV-062, EV-063                                                                                |
| BRs / FRs                    | BR-009; FR-036, FR-037; AUTH-REQ-013, AUTH-REQ-014                                            |
| Risco                        | RISK-005, RISK-013                                                                            |
| Criticidade                  | HIGH                                                                                          |
| Escopo                       | MEASUREMENT                                                                                   |
| Estímulo                     | Submissão e decisão de medição                                                                |
| Ambiente                     | Fluxo de medição                                                                              |
| Artefato afetado             | Medição                                                                                       |
| Resposta esperada            | Decisão somente por ator autorizado                                                           |
| Medida da resposta           | Violações de SoD em revisão                                                                   |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                            |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                    |
| Owner                        | UNKNOWN                                                                                       |
| DDPs                         | DDP-010                                                                                       |
| Status                       | PENDING_BUSINESS_DECISION                                                                     |
| Critérios de validação       | QA-SC-013                                                                                     |

## NFR-014 — Consistência de consumo de PO

| Campo                        | Valor                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-014                                                                                                   |
| Título                       | Consistência de consumo de PO                                                                             |
| Declaração normativa         | Consumo de PO candidato deverá respeitar saldo autorizado quando regra existir, sem excedente silencioso. |
| Categoria                    | INTEGRITY / FINANCIAL                                                                                     |
| Fonte                        | SRC-001                                                                                                   |
| Evidências                   | EV-060, EV-059                                                                                            |
| BRs / FRs                    | BR-008; FR-033; VR-010                                                                                    |
| Risco                        | RISK-009                                                                                                  |
| Criticidade                  | HIGH                                                                                                      |
| Escopo                       | COMMERCIAL                                                                                                |
| Estímulo                     | Registro de consumo                                                                                       |
| Ambiente                     | Vínculo comercial ativo                                                                                   |
| Artefato afetado             | Saldo de PO                                                                                               |
| Resposta esperada            | Sinalização ou bloqueio conforme DDP-009                                                                  |
| Medida da resposta           | Excedentes não detectados                                                                                 |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                        |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                |
| Owner                        | UNKNOWN                                                                                                   |
| DDPs                         | DDP-009                                                                                                   |
| Status                       | PENDING_BUSINESS_DECISION                                                                                 |
| Critérios de validação       | QA-SC-014                                                                                                 |

## NFR-015 — Integridade de evidências de execução

| Campo                        | Valor                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ID                           | NFR-015                                                                                                                  |
| Título                       | Integridade de evidências de execução                                                                                    |
| Declaração normativa         | Evidências de execução deverão permanecer vinculadas ao contexto operacional correto e não ser substituíveis sem trilha. |
| Categoria                    | INTEGRITY / EVIDENCE                                                                                                     |
| Fonte                        | SRC-001                                                                                                                  |
| Evidências                   | EV-046, EV-067                                                                                                           |
| BRs / FRs                    | FR-040; DOC-REQ-007                                                                                                      |
| Risco                        | RISK-008                                                                                                                 |
| Criticidade                  | HIGH                                                                                                                     |
| Escopo                       | EXECUTION                                                                                                                |
| Estímulo                     | Anexo ou substituição de evidência                                                                                       |
| Ambiente                     | Campo / escritório                                                                                                       |
| Artefato afetado             | Evidência de execução                                                                                                    |
| Resposta esperada            | Vínculo válido ou rejeição                                                                                               |
| Medida da resposta           | Evidências órfãs ou trocadas                                                                                             |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                       |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                               |
| Owner                        | UNKNOWN                                                                                                                  |
| DDPs                         | DDP-013                                                                                                                  |
| Status                       | PENDING_SOURCE_VALIDATION                                                                                                |
| Critérios de validação       | QA-SC-015                                                                                                                |

## NFR-016 — Gestão de sessão segura (decisão aberta)

| Campo                        | Valor                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-016                                                                                                                    |
| Título                       | Gestão de sessão segura                                                                                                    |
| Declaração normativa         | Sessões de uso futuro deverão permitir encerramento, expiração e proteção contra uso indevido conforme política a definir. |
| Categoria                    | SECURITY / SESSION                                                                                                         |
| Fonte                        | SRC-001                                                                                                                    |
| Evidências                   | EV-078                                                                                                                     |
| BRs / FRs                    | AUTH-REQ-* (transversal)                                                                                                   |
| Risco                        | RISK-007                                                                                                                   |
| Criticidade                  | HIGH                                                                                                                       |
| Escopo                       | GLOBAL                                                                                                                     |
| Estímulo                     | Sessão abandonada ou sequestrada                                                                                           |
| Ambiente                     | Acesso autenticado futuro                                                                                                  |
| Artefato afetado             | Sessão                                                                                                                     |
| Resposta esperada            | Expiração ou revogação conforme política                                                                                   |
| Medida da resposta           | MEASUREMENT_METHOD_PENDING                                                                                                 |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                         |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                 |
| Owner                        | UNKNOWN                                                                                                                    |
| DDPs                         | DDP-015                                                                                                                    |
| Status                       | PENDING_MEASUREMENT                                                                                                        |
| Critérios de validação       | SEC-REQ-011; NFNQ-003                                                                                                      |

## NFR-017 — Segurança de upload de arquivos

| Campo                        | Valor                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-017                                                                                                         |
| Título                       | Segurança de upload de arquivos                                                                                 |
| Declaração normativa         | Upload de arquivos deverá rejeitar ou isolar conteúdo inválido ou malicioso candidato conforme política futura. |
| Categoria                    | SECURITY / UPLOAD                                                                                               |
| Fonte                        | SRC-001                                                                                                         |
| Evidências                   | EV-030, EV-067                                                                                                  |
| BRs / FRs                    | FR-004, FR-040                                                                                                  |
| Risco                        | RISK-016                                                                                                        |
| Criticidade                  | HIGH                                                                                                            |
| Escopo                       | DOCUMENT, SERVICE_REQUEST                                                                                       |
| Estímulo                     | Upload de arquivo                                                                                               |
| Ambiente                     | Anexo a solicitação ou execução                                                                                 |
| Artefato afetado             | Arquivo associado                                                                                               |
| Resposta esperada            | Rejeição ou quarentena sem execução                                                                             |
| Medida da resposta           | Incidentes de upload malicioso                                                                                  |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                              |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                      |
| Owner                        | UNKNOWN                                                                                                         |
| DDPs                         | DDP-033                                                                                                         |
| Status                       | PENDING_MEASUREMENT                                                                                             |
| Critérios de validação       | QA-SC-016; SEC-REQ-012                                                                                          |

## NFR-018 — Proteção de segredos e credenciais

| Campo                        | Valor                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-018                                                                                                     |
| Título                       | Proteção de segredos e credenciais                                                                          |
| Declaração normativa         | Segredos de integração e credenciais não deverão ser expostos em interfaces, logs ou repositório de código. |
| Categoria                    | SECURITY / SECRETS                                                                                          |
| Fonte                        | SRC-001                                                                                                     |
| Evidências                   | EV-077                                                                                                      |
| BRs / FRs                    | INT-REQ-*                                                                                                   |
| Risco                        | RISK-015                                                                                                    |
| Criticidade                  | CRITICAL                                                                                                    |
| Escopo                       | INTEGRATION                                                                                                 |
| Estímulo                     | Configuração ou operação                                                                                    |
| Ambiente                     | Qualquer                                                                                                    |
| Artefato afetado             | Segredos                                                                                                    |
| Resposta esperada            | Armazenamento e acesso conforme política futura                                                             |
| Medida da resposta           | Vazamentos em auditoria de segurança                                                                        |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                          |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                  |
| Owner                        | UNKNOWN                                                                                                     |
| DDPs                         | DDP-014                                                                                                     |
| Status                       | PENDING_MEASUREMENT                                                                                         |
| Critérios de validação       | SEC-REQ-013                                                                                                 |

## NFR-019 — Segregação de funções em ações sensíveis

| Campo                        | Valor                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-019                                                                                                                |
| Título                       | Segregação de funções em ações sensíveis                                                                               |
| Declaração normativa         | Ações que combinam preparação e aprovação deverão respeitar segregação candidata (ex.: quem prepara OS ≠ quem libera). |
| Categoria                    | SECURITY / SOD                                                                                                         |
| Fonte                        | SRC-001                                                                                                                |
| Evidências                   | EV-039, EV-062                                                                                                         |
| BRs / FRs                    | BR-006, BR-009; FR-014, FR-037                                                                                         |
| Risco                        | RISK-013                                                                                                               |
| Criticidade                  | HIGH                                                                                                                   |
| Escopo                       | GLOBAL                                                                                                                 |
| Estímulo                     | Mesmo ator em papéis incompatíveis                                                                                     |
| Ambiente                     | Operação                                                                                                               |
| Artefato afetado             | Fluxos sensíveis                                                                                                       |
| Resposta esperada            | Bloqueio ou alerta conforme matriz SoD futura                                                                          |
| Medida da resposta           | Violações SoD detectadas                                                                                               |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                     |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                             |
| Owner                        | UNKNOWN                                                                                                                |
| DDPs                         | DDP-015, DDP-022                                                                                                       |
| Status                       | PENDING_BUSINESS_DECISION                                                                                              |
| Critérios de validação       | QA-SC-017; SEC-REQ-014                                                                                                 |

## NFR-020 — Proteção contra enumeração abusiva

| Campo                        | Valor                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-020                                                                                                              |
| Título                       | Proteção contra enumeração abusiva                                                                                   |
| Declaração normativa         | Consultas que revelem existência de registros sensíveis deverão limitar enumeração abusiva conforme política futura. |
| Categoria                    | SECURITY / ABUSE                                                                                                     |
| Fonte                        | SRC-001                                                                                                              |
| Evidências                   | EV-078                                                                                                               |
| BRs / FRs                    | FR-032 (transversal)                                                                                                 |
| Risco                        | RISK-007                                                                                                             |
| Criticidade                  | MEDIUM                                                                                                               |
| Escopo                       | GLOBAL                                                                                                               |
| Estímulo                     | Varredura de identificadores                                                                                         |
| Ambiente                     | Acesso autenticado futuro                                                                                            |
| Artefato afetado             | Consultas                                                                                                            |
| Resposta esperada            | Resposta uniforme ou limitação de taxa conforme decisão                                                              |
| Medida da resposta           | MEASUREMENT_METHOD_PENDING                                                                                           |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                   |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                           |
| Owner                        | UNKNOWN                                                                                                              |
| DDPs                         | DDP-015                                                                                                              |
| Status                       | PENDING_MEASUREMENT                                                                                                  |
| Critérios de validação       | SEC-REQ-015                                                                                                          |

## NFR-021 — Controle de exportação de dados restritos

| Campo                        | Valor                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| ID                           | NFR-021                                                                                                |
| Título                       | Controle de exportação de dados restritos                                                              |
| Declaração normativa         | Exportação de dados restritos ou relatórios sensíveis deverá exigir autorização e registro candidatos. |
| Categoria                    | SECURITY / EXPORT                                                                                      |
| Fonte                        | SRC-001                                                                                                |
| Evidências                   | EV-061, EV-078                                                                                         |
| BRs / FRs                    | FR-032; RPT-REQ-*                                                                                      |
| Risco                        | RISK-020                                                                                               |
| Criticidade                  | HIGH                                                                                                   |
| Escopo                       | REPORTING                                                                                              |
| Estímulo                     | Exportação em massa                                                                                    |
| Ambiente                     | Relatórios                                                                                             |
| Artefato afetado             | Dados exportados                                                                                       |
| Resposta esperada            | Autorização e trilha                                                                                   |
| Medida da resposta           | Exportações não autorizadas                                                                            |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                     |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                             |
| Owner                        | UNKNOWN                                                                                                |
| DDPs                         | DDP-030                                                                                                |
| Status                       | PENDING_BUSINESS_DECISION                                                                              |
| Critérios de validação       | SEC-REQ-016; QA-SC-018                                                                                 |

## NFR-022 — Prontidão para autenticação futura

| Campo                        | Valor                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-022                                                                                                  |
| Título                       | Prontidão para autenticação futura                                                                       |
| Declaração normativa         | O sistema futuro deverá suportar identificação de atores sem assumir provedor de identidade nesta etapa. |
| Categoria                    | SECURITY / AUTHENTICATION                                                                                |
| Fonte                        | SRC-001                                                                                                  |
| Evidências                   | EV-078                                                                                                   |
| BRs / FRs                    | AUTH-REQ-*                                                                                               |
| Risco                        | RISK-007                                                                                                 |
| Criticidade                  | HIGH                                                                                                     |
| Escopo                       | GLOBAL                                                                                                   |
| Estímulo                     | Necessidade de login                                                                                     |
| Ambiente                     | Pré-implementação                                                                                        |
| Artefato afetado             | Identidade de ator                                                                                       |
| Resposta esperada            | Decisão de IdP e fluxo em prompt futuro                                                                  |
| Medida da resposta           | N/A nesta etapa                                                                                          |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                       |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                               |
| Owner                        | UNKNOWN                                                                                                  |
| DDPs                         | DDP-015                                                                                                  |
| Status                       | PENDING_MEASUREMENT                                                                                      |
| Critérios de validação       | SEC-REQ-017; OPEN_SECURITY_DECISION                                                                      |

## NFR-023 — Disponibilidade operacional candidata

| Campo                        | Valor                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-023                                                                                                        |
| Título                       | Disponibilidade operacional candidata                                                                          |
| Declaração normativa         | O sistema deverá suportar operação durante janelas empresariais relevantes conforme disponibilidade a definir. |
| Categoria                    | AVAILABILITY                                                                                                   |
| Fonte                        | SRC-001                                                                                                        |
| Evidências                   | EV-005, EV-074                                                                                                 |
| BRs / FRs                    | FR-005, FR-017 (transversal)                                                                                   |
| Risco                        | RISK-002                                                                                                       |
| Criticidade                  | HIGH                                                                                                           |
| Escopo                       | GLOBAL                                                                                                         |
| Estímulo                     | Indisponibilidade                                                                                              |
| Ambiente                     | Horário operacional                                                                                            |
| Artefato afetado             | Serviço como um todo                                                                                           |
| Resposta esperada            | Degradação controlada ou indisponibilidade explícita                                                           |
| Medida da resposta           | Tempo de indisponibilidade                                                                                     |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                             |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                     |
| Owner                        | UNKNOWN                                                                                                        |
| DDPs                         | DDP-016, DDP-040                                                                                               |
| Status                       | PENDING_MEASUREMENT                                                                                            |
| Critérios de validação       | QA-SC-019                                                                                                      |

## NFR-024 — Degradação graciosa sob falha parcial

| Campo                        | Valor                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-024                                                                                                               |
| Título                       | Degradação graciosa sob falha parcial                                                                                 |
| Declaração normativa         | Falha de componente não crítico não deverá corromper operações financeiras ou de auditoria já confirmadas localmente. |
| Categoria                    | RELIABILITY                                                                                                           |
| Fonte                        | SRC-001                                                                                                               |
| Evidências                   | EV-077                                                                                                                |
| BRs / FRs                    | FR-030; INT-REQ-*                                                                                                     |
| Risco                        | RISK-010                                                                                                              |
| Criticidade                  | HIGH                                                                                                                  |
| Escopo                       | GLOBAL                                                                                                                |
| Estímulo                     | Falha parcial                                                                                                         |
| Ambiente                     | Integração ou subsistema indisponível                                                                                 |
| Artefato afetado             | Operações em andamento                                                                                                |
| Resposta esperada            | Falha isolada; reconciliação posterior                                                                                |
| Medida da resposta           | Corrupção de dados em teste de caos futuro                                                                            |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                    |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                            |
| Owner                        | UNKNOWN                                                                                                               |
| DDPs                         | DDP-014                                                                                                               |
| Status                       | PENDING_SOURCE_VALIDATION                                                                                             |
| Critérios de validação       | QA-SC-020                                                                                                             |

## NFR-025 — Backup recuperável

| Campo                        | Valor                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| ID                           | NFR-025                                                                                             |
| Título                       | Backup recuperável                                                                                  |
| Declaração normativa         | Dados empresariais críticos candidatos deverão ser passíveis de backup conforme política a definir. |
| Categoria                    | RECOVERABILITY                                                                                      |
| Fonte                        | SRC-001                                                                                             |
| Evidências                   | EV-083                                                                                              |
| BRs / FRs                    | DR-023; CAP-026                                                                                     |
| Risco                        | RISK-011                                                                                            |
| Criticidade                  | HIGH                                                                                                |
| Escopo                       | GLOBAL                                                                                              |
| Estímulo                     | Necessidade de restauração                                                                          |
| Ambiente                     | Desastre ou erro operacional                                                                        |
| Artefato afetado             | Dados persistidos                                                                                   |
| Resposta esperada            | Restauração conforme RPO futuro                                                                     |
| Medida da resposta           | Sucesso de restore em teste                                                                         |
| Valor-alvo                   | TARGET_NOT_DEFINED (RPO: DDP-016)                                                                   |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                          |
| Owner                        | UNKNOWN                                                                                             |
| DDPs                         | DDP-016, DDP-017                                                                                    |
| Status                       | PENDING_MEASUREMENT                                                                                 |
| Critérios de validação       | QA-SC-021                                                                                           |

## NFR-026 — Teste periódico de restauração

| Campo                        | Valor                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-026                                                                                                 |
| Título                       | Teste periódico de restauração                                                                          |
| Declaração normativa         | Restauração a partir de backup deverá ser testável periodicamente conforme política operacional futura. |
| Categoria                    | RECOVERABILITY                                                                                          |
| Fonte                        | SRC-001                                                                                                 |
| Evidências                   | EV-083                                                                                                  |
| BRs / FRs                    | —                                                                                                       |
| Risco                        | RISK-011                                                                                                |
| Criticidade                  | HIGH                                                                                                    |
| Escopo                       | GLOBAL                                                                                                  |
| Estímulo                     | Auditoria ou DR drill                                                                                   |
| Ambiente                     | Homologação ou isolado                                                                                  |
| Artefato afetado             | Backup                                                                                                  |
| Resposta esperada            | Evidência de restore bem-sucedido                                                                       |
| Medida da resposta           | Frequência e sucesso de testes                                                                          |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                      |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                              |
| Owner                        | UNKNOWN                                                                                                 |
| DDPs                         | DDP-016                                                                                                 |
| Status                       | PENDING_MEASUREMENT                                                                                     |
| Critérios de validação       | QA-SC-022                                                                                               |

## NFR-027 — RPO empresarial

| Campo                        | Valor                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| ID                           | NFR-027                                                                                      |
| Título                       | RPO empresarial                                                                              |
| Declaração normativa         | Perda máxima aceitável de dados deverá ser definida empresarialmente antes da implementação. |
| Categoria                    | RECOVERABILITY                                                                               |
| Fonte                        | SRC-001                                                                                      |
| Evidências                   | EV-083                                                                                       |
| BRs / FRs                    | —                                                                                            |
| Risco                        | RISK-011                                                                                     |
| Criticidade                  | HIGH                                                                                         |
| Escopo                       | GLOBAL                                                                                       |
| Estímulo                     | Definição de continuidade                                                                    |
| Ambiente                     | Planejamento                                                                                 |
| Artefato afetado             | Política de backup                                                                           |
| Resposta esperada            | Valor RPO autorizado                                                                         |
| Medida da resposta           | RPO em horas/minutos                                                                         |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                           |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                   |
| Owner                        | UNKNOWN                                                                                      |
| DDPs                         | DDP-016                                                                                      |
| Status                       | PENDING_MEASUREMENT                                                                          |
| Critérios de validação       | NFNQ-001                                                                                     |

## NFR-028 — RTO empresarial

| Campo                        | Valor                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| ID                           | NFR-028                                                                                            |
| Título                       | RTO empresarial                                                                                    |
| Declaração normativa         | Tempo máximo aceitável de recuperação deverá ser definido empresarialmente antes da implementação. |
| Categoria                    | RECOVERABILITY                                                                                     |
| Fonte                        | SRC-001                                                                                            |
| Evidências                   | EV-083                                                                                             |
| BRs / FRs                    | —                                                                                                  |
| Risco                        | RISK-011                                                                                           |
| Criticidade                  | HIGH                                                                                               |
| Escopo                       | GLOBAL                                                                                             |
| Estímulo                     | Definição de continuidade                                                                          |
| Ambiente                     | Planejamento                                                                                       |
| Artefato afetado             | Plano de continuidade                                                                              |
| Resposta esperada            | Valor RTO autorizado                                                                               |
| Medida da resposta           | RTO em horas/minutos                                                                               |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                 |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                         |
| Owner                        | UNKNOWN                                                                                            |
| DDPs                         | DDP-016                                                                                            |
| Status                       | PENDING_MEASUREMENT                                                                                |
| Critérios de validação       | NFNQ-002                                                                                           |

## NFR-029 — Registro de eventos de negócio relevantes

| Campo                        | Valor                                                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-029                                                                                                                                         |
| Título                       | Registro de eventos de negócio relevantes                                                                                                       |
| Declaração normativa         | Eventos empresariais relevantes (liberação, decisão, substituição documental) deverão ser registrados para auditoria, distintos de log técnico. |
| Categoria                    | OBSERVABILITY / AUDITABILITY                                                                                                                    |
| Fonte                        | SRC-001                                                                                                                                         |
| Evidências                   | EV-078, EV-030                                                                                                                                  |
| BRs / FRs                    | NOTIF-REQ-*; FR-014, FR-006, FR-042                                                                                                             |
| Risco                        | RISK-024                                                                                                                                        |
| Criticidade                  | HIGH                                                                                                                                            |
| Escopo                       | GLOBAL                                                                                                                                          |
| Estímulo                     | Evento de negócio                                                                                                                               |
| Ambiente                     | Operação                                                                                                                                        |
| Artefato afetado             | AUDIT_TRAIL / DOMAIN_HISTORY                                                                                                                    |
| Resposta esperada            | Registro consultável com contexto mínimo                                                                                                        |
| Medida da resposta           | Completude em auditoria                                                                                                                         |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                                              |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                                      |
| Owner                        | UNKNOWN                                                                                                                                         |
| DDPs                         | DDP-038                                                                                                                                         |
| Status                       | PENDING_SOURCE_VALIDATION                                                                                                                       |
| Critérios de validação       | QA-SC-023                                                                                                                                       |

## NFR-030 — Correlação de operações relacionadas

| Campo                        | Valor                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-030                                                                                                                     |
| Título                       | Correlação de operações relacionadas                                                                                        |
| Declaração normativa         | Operações relacionadas (solicitação → OS → medição → faturamento candidato) deverão ser correlacionáveis para investigação. |
| Categoria                    | OBSERVABILITY                                                                                                               |
| Fonte                        | SRC-001                                                                                                                     |
| Evidências                   | EV-005, EV-062                                                                                                              |
| BRs / FRs                    | FR-001, FR-009, FR-035, FR-039                                                                                              |
| Risco                        | RISK-005                                                                                                                    |
| Criticidade                  | HIGH                                                                                                                        |
| Escopo                       | GLOBAL                                                                                                                      |
| Estímulo                     | Investigação de incidente ou auditoria                                                                                      |
| Ambiente                     | Suporte e auditoria                                                                                                         |
| Artefato afetado             | TRACE / correlação                                                                                                          |
| Resposta esperada            | Identificador de correlação transversal                                                                                     |
| Medida da resposta           | Tempo para reconstruir cadeia                                                                                               |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                          |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                  |
| Owner                        | UNKNOWN                                                                                                                     |
| DDPs                         | DDP-038                                                                                                                     |
| Status                       | PENDING_MEASUREMENT                                                                                                         |
| Critérios de validação       | QA-SC-024                                                                                                                   |

## NFR-031 — Alertas para condições operacionais críticas

| Campo                        | Valor                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-031                                                                                                                                                    |
| Título                       | Alertas para condições operacionais críticas                                                                                                               |
| Declaração normativa         | Condições críticas candidatas (conflito de alocação, divergência comercial, falha de integração) deverão ser passíveis de alerta conforme política futura. |
| Categoria                    | OBSERVABILITY                                                                                                                                              |
| Fonte                        | SRC-001                                                                                                                                                    |
| Evidências                   | EV-074, EV-023                                                                                                                                             |
| BRs / FRs                    | FR-028, FR-034; RPT-REQ-005, RPT-REQ-006                                                                                                                   |
| Risco                        | RISK-002                                                                                                                                                   |
| Criticidade                  | MEDIUM                                                                                                                                                     |
| Escopo                       | OPERATIONS                                                                                                                                                 |
| Estímulo                     | Condição crítica detectada                                                                                                                                 |
| Ambiente                     | Operação                                                                                                                                                   |
| Artefato afetado             | ALERT                                                                                                                                                      |
| Resposta esperada            | Notificação a responsável candidato                                                                                                                        |
| Medida da resposta           | Tempo até reconhecimento                                                                                                                                   |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                                                         |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                                                 |
| Owner                        | UNKNOWN                                                                                                                                                    |
| DDPs                         | DDP-038, DDP-024                                                                                                                                           |
| Status                       | PENDING_MEASUREMENT                                                                                                                                        |
| Critérios de validação       | QA-SC-025                                                                                                                                                  |

## NFR-032 — Medição de tempo de resposta por classe de operação

| Campo                        | Valor                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-032                                                                                                                          |
| Título                       | Medição de tempo de resposta por classe de operação                                                                              |
| Declaração normativa         | Classes de operação (consulta, registro transacional, relatório, upload) deverão ser mensuráveis antes de fixar metas numéricas. |
| Categoria                    | PERFORMANCE                                                                                                                      |
| Fonte                        | SRC-001                                                                                                                          |
| Evidências                   | EV-074, EV-075                                                                                                                   |
| BRs / FRs                    | UC-026; RPT-REQ-*                                                                                                                |
| Risco                        | RISK-002                                                                                                                         |
| Criticidade                  | MEDIUM                                                                                                                           |
| Escopo                       | GLOBAL                                                                                                                           |
| Estímulo                     | Uso sob carga                                                                                                                    |
| Ambiente                     | Pico operacional                                                                                                                 |
| Artefato afetado             | METRIC                                                                                                                           |
| Resposta esperada            | Baseline medido                                                                                                                  |
| Medida da resposta           | Latência por classe                                                                                                              |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                               |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                       |
| Owner                        | UNKNOWN                                                                                                                          |
| DDPs                         | DDP-036, DDP-017                                                                                                                 |
| Status                       | PENDING_MEASUREMENT                                                                                                              |
| Critérios de validação       | QA-SC-026; NFNQ-004                                                                                                              |

## NFR-033 — Capacidade de usuários simultâneos

| Campo                        | Valor                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-033                                                                                                  |
| Título                       | Capacidade de usuários simultâneos                                                                       |
| Declaração normativa         | Número de usuários simultâneos esperados deverá ser levantado empresarialmente antes de dimensionamento. |
| Categoria                    | PERFORMANCE / CAPACITY                                                                                   |
| Fonte                        | SRC-001                                                                                                  |
| Evidências                   | EV-075                                                                                                   |
| BRs / FRs                    | —                                                                                                        |
| Risco                        | RISK-002                                                                                                 |
| Criticidade                  | MEDIUM                                                                                                   |
| Escopo                       | GLOBAL                                                                                                   |
| Estímulo                     | Crescimento de uso                                                                                       |
| Ambiente                     | Planejamento                                                                                             |
| Artefato afetado             | Capacidade                                                                                               |
| Resposta esperada            | Estimativa empresarial                                                                                   |
| Medida da resposta           | Usuários simultâneos                                                                                     |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                       |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                               |
| Owner                        | UNKNOWN                                                                                                  |
| DDPs                         | DDP-017                                                                                                  |
| Status                       | PENDING_MEASUREMENT                                                                                      |
| Critérios de validação       | NFNQ-005                                                                                                 |

## NFR-034 — Medição de volume e tamanho de arquivos

| Campo                        | Valor                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| ID                           | NFR-034                                                                                    |
| Título                       | Medição de volume e tamanho de arquivos                                                    |
| Declaração normativa         | Tamanho e quantidade de arquivos anexados deverão ser levantados antes de definir limites. |
| Categoria                    | PERFORMANCE / CAPACITY                                                                     |
| Fonte                        | SRC-001                                                                                    |
| Evidências                   | EV-067, EV-069                                                                             |
| BRs / FRs                    | FR-004, FR-041                                                                             |
| Risco                        | RISK-016                                                                                   |
| Criticidade                  | MEDIUM                                                                                     |
| Escopo                       | DOCUMENT                                                                                   |
| Estímulo                     | Upload e armazenamento                                                                     |
| Ambiente                     | Operação com evidências                                                                    |
| Artefato afetado             | Armazenamento                                                                              |
| Resposta esperada            | Inventário de volumes                                                                      |
| Medida da resposta           | Tamanho médio e pico                                                                       |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                         |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                 |
| Owner                        | UNKNOWN                                                                                    |
| DDPs                         | DDP-017                                                                                    |
| Status                       | PENDING_MEASUREMENT                                                                        |
| Critérios de validação       | NFNQ-006                                                                                   |

## NFR-035 — Medição de desempenho de integrações

| Campo                        | Valor                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-035                                                                                                 |
| Título                       | Medição de desempenho de integrações                                                                    |
| Declaração normativa         | Latência e taxa de falha de integrações candidatas deverão ser mensuráveis após definição de contratos. |
| Categoria                    | PERFORMANCE / INTEGRATION                                                                               |
| Fonte                        | SRC-001                                                                                                 |
| Evidências                   | EV-077                                                                                                  |
| BRs / FRs                    | INT-REQ-*; FR-030                                                                                       |
| Risco                        | RISK-010                                                                                                |
| Criticidade                  | MEDIUM                                                                                                  |
| Escopo                       | INTEGRATION                                                                                             |
| Estímulo                     | Chamada externa                                                                                         |
| Ambiente                     | Integração ativa                                                                                        |
| Artefato afetado             | METRIC de integração                                                                                    |
| Resposta esperada            | Baseline sem meta inventada                                                                             |
| Medida da resposta           | Latência e erro                                                                                         |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                      |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                              |
| Owner                        | UNKNOWN                                                                                                 |
| DDPs                         | DDP-014, DDP-036                                                                                        |
| Status                       | PENDING_MEASUREMENT                                                                                     |
| Critérios de validação       | NFNQ-007                                                                                                |

## NFR-036 — Minimização de dados pessoais candidata

| Campo                        | Valor                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-036                                                                                                                      |
| Título                       | Minimização de dados pessoais candidata                                                                                      |
| Declaração normativa         | Coleta de dados pessoais deverá limitar-se ao necessário para a finalidade operacional declarada, sujeito a validação legal. |
| Categoria                    | PRIVACY                                                                                                                      |
| Fonte                        | SRC-001                                                                                                                      |
| Evidências                   | EV-029, EV-030                                                                                                               |
| BRs / FRs                    | FR-003; DR-003                                                                                                               |
| Risco                        | RISK-007                                                                                                                     |
| Criticidade                  | HIGH                                                                                                                         |
| Escopo                       | GLOBAL                                                                                                                       |
| Estímulo                     | Cadastro de solicitante ou funcionário                                                                                       |
| Ambiente                     | Operação                                                                                                                     |
| Artefato afetado             | Dados pessoais                                                                                                               |
| Resposta esperada            | Campos mínimos                                                                                                               |
| Medida da resposta           | Revisão de minimização                                                                                                       |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                           |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                   |
| Owner                        | UNKNOWN                                                                                                                      |
| DDPs                         | DDP-039                                                                                                                      |
| Status                       | PENDING_LEGAL_VALIDATION                                                                                                     |
| Critérios de validação       | NFNQ-008                                                                                                                     |

## NFR-037 — Política de retenção empresarial

| Campo                        | Valor                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-037                                                                                                           |
| Título                       | Política de retenção empresarial                                                                                  |
| Declaração normativa         | Períodos de retenção de dados e documentos deverão ser definidos empresarial e legalmente antes da implementação. |
| Categoria                    | RETENTION                                                                                                         |
| Fonte                        | SRC-001                                                                                                           |
| Evidências                   | EV-081, EV-083                                                                                                    |
| BRs / FRs                    | DOC-REQ-014; DR-023                                                                                               |
| Risco                        | RISK-008                                                                                                          |
| Criticidade                  | HIGH                                                                                                              |
| Escopo                       | GLOBAL                                                                                                            |
| Estímulo                     | Armazenamento prolongado                                                                                          |
| Ambiente                     | Operação e arquivo                                                                                                |
| Artefato afetado             | Dados e documentos                                                                                                |
| Resposta esperada            | Política autorizada                                                                                               |
| Medida da resposta           | Prazo de retenção                                                                                                 |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                        |
| Owner                        | UNKNOWN                                                                                                           |
| DDPs                         | DDP-019                                                                                                           |
| Status                       | PENDING_LEGAL_VALIDATION                                                                                          |
| Critérios de validação       | NFNQ-009                                                                                                          |

## NFR-038 — Descarte seguro de dados

| Campo                        | Valor                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-038                                                                                                 |
| Título                       | Descarte seguro de dados                                                                                |
| Declaração normativa         | Descarte de dados ao fim da retenção deverá ser executável de forma auditável conforme política futura. |
| Categoria                    | RETENTION / PRIVACY                                                                                     |
| Fonte                        | SRC-001                                                                                                 |
| Evidências                   | EV-083                                                                                                  |
| BRs / FRs                    | DOC-REQ-014                                                                                             |
| Risco                        | RISK-008                                                                                                |
| Criticidade                  | MEDIUM                                                                                                  |
| Escopo                       | GLOBAL                                                                                                  |
| Estímulo                     | Fim de ciclo de vida                                                                                    |
| Ambiente                     | Operação                                                                                                |
| Artefato afetado             | Dados descartados                                                                                       |
| Resposta esperada            | Evidência de descarte                                                                                   |
| Medida da resposta           | Registros de descarte                                                                                   |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                      |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                              |
| Owner                        | UNKNOWN                                                                                                 |
| DDPs                         | DDP-019                                                                                                 |
| Status                       | PENDING_LEGAL_VALIDATION                                                                                |
| Critérios de validação       | NFNQ-010                                                                                                |

## NFR-039 — Dados pessoais em logs e telemetria

| Campo                        | Valor                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-039                                                                                                         |
| Título                       | Dados pessoais em logs e telemetria                                                                             |
| Declaração normativa         | Logs técnicos e telemetria deverão evitar exposição desnecessária de dados pessoais, sujeito a validação legal. |
| Categoria                    | PRIVACY / OBSERVABILITY                                                                                         |
| Fonte                        | SRC-001                                                                                                         |
| Evidências                   | EV-029                                                                                                          |
| BRs / FRs                    | —                                                                                                               |
| Risco                        | RISK-024                                                                                                        |
| Criticidade                  | HIGH                                                                                                            |
| Escopo                       | GLOBAL                                                                                                          |
| Estímulo                     | Registro técnico                                                                                                |
| Ambiente                     | Operação                                                                                                        |
| Artefato afetado             | TECHNICAL_LOG, TRACE                                                                                            |
| Resposta esperada            | Redação ou exclusão de PII desnecessária                                                                        |
| Medida da resposta           | Auditoria de logs                                                                                               |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                              |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                      |
| Owner                        | UNKNOWN                                                                                                         |
| DDPs                         | DDP-039                                                                                                         |
| Status                       | PENDING_LEGAL_VALIDATION                                                                                        |
| Critérios de validação       | NFNQ-011; QA-SC-027                                                                                             |

## NFR-040 — Evolução sem quebra de trilha de auditoria

| Campo                        | Valor                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ID                           | NFR-040                                                                                                                                   |
| Título                       | Evolução sem quebra de trilha de auditoria                                                                                                |
| Declaração normativa         | Evoluções futuras do sistema não deverão tornar histórico empresarial pré-existente ilegível ou não consultável sem migração documentada. |
| Categoria                    | MAINTAINABILITY                                                                                                                           |
| Fonte                        | SRC-001                                                                                                                                   |
| Evidências                   | EV-078, EV-082                                                                                                                            |
| BRs / FRs                    | FR-022; DR-023                                                                                                                            |
| Risco                        | RISK-014                                                                                                                                  |
| Criticidade                  | HIGH                                                                                                                                      |
| Escopo                       | GLOBAL                                                                                                                                    |
| Estímulo                     | Mudança de versão ou schema                                                                                                               |
| Ambiente                     | Evolução                                                                                                                                  |
| Artefato afetado             | Histórico e auditoria                                                                                                                     |
| Resposta esperada            | Migração rastreável                                                                                                                       |
| Medida da resposta           | Integridade pós-migração                                                                                                                  |
| Valor-alvo                   | TARGET_NOT_DEFINED                                                                                                                        |
| Método futuro de verificação | MEASUREMENT_METHOD_PENDING                                                                                                                |
| Owner                        | UNKNOWN                                                                                                                                   |
| DDPs                         | DDP-038                                                                                                                                   |
| Status                       | PENDING_SOURCE_VALIDATION                                                                                                                 |
| Critérios de validação       | QA-SC-028                                                                                                                                 |
