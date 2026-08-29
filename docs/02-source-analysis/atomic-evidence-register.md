# Registro de evidências atômicas

| Campo                      | Valor                           |
| -------------------------- | ------------------------------- |
| Document ID                | AER-001                         |
| Prompt                     | 01 — Ingestão e análise atômica |
| Fonte principal            | SRC-001                         |
| Total de evidências        | **84**                          |
| Regras CONFIRMED derivadas | **0**                           |

Cada evidência deriva de SRC-001 salvo nota em contrário. SRC-000 aparece apenas em meta-governança quando aplicável.

## Legenda de colunas

- **Temporal orientation:** `CURRENT_STATE`, `DESIRED_FUTURE`, `TIMELESS`, `UNKNOWN`
- **Semantic status:** classificação do que a evidência afirma (fato relatado, hipótese, proibição, etc.)
- **Confidence:** `HIGH` / `MEDIUM` / `LOW` — confiança na fidelidade da evidência à intenção da fonte, não na verdade operacional

## EV-001

| Campo                | Valor                                                                              |
| -------------------- | ---------------------------------------------------------------------------------- |
| Evidence ID          | EV-001                                                                             |
| Source ID            | SRC-001                                                                            |
| Source locator       | §3                                                                                 |
| Evidence statement   | A Cisne Rondônia é descrita como empresa privada sediada em Porto Velho, Rondônia. |
| Evidence type        | BUSINESS_FACT                                                                      |
| Temporal orientation | CURRENT_STATE                                                                      |
| Semantic status      | REPORTED_AS_IS                                                                     |
| Modality             | ASSERTIVE                                                                          |
| Confidence           | MEDIUM                                                                             |
| Scope                | ORGANIZATION                                                                       |
| Domain               | ORGANIZATION                                                                       |
| Actor                | TBD                                                                                |
| Related terms        | Cisne Rondônia; Porto Velho                                                        |
| Candidate rule       | TBD                                                                                |
| Pending decision     | TBD                                                                                |
| Conflict             | NONE                                                                               |
| Notes                |                                                                                    |

## EV-002

| Campo                | Valor                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-002                                                                                                                                                                                                                      |
| Source ID            | SRC-001                                                                                                                                                                                                                     |
| Source locator       | §3                                                                                                                                                                                                                          |
| Evidence statement   | Foram citadas atividades incluindo representação comercial, logística, transportes rodoviários de cargas (municipal a internacional), fretamento de passageiros, locações e serviços com veículos/equipamentos/mão de obra. |
| Evidence type        | BUSINESS_FACT                                                                                                                                                                                                               |
| Temporal orientation | CURRENT_STATE                                                                                                                                                                                                               |
| Semantic status      | REPORTED_AS_IS                                                                                                                                                                                                              |
| Modality             | ASSERTIVE                                                                                                                                                                                                                   |
| Confidence           | MEDIUM                                                                                                                                                                                                                      |
| Scope                | ACTIVITY                                                                                                                                                                                                                    |
| Domain               | ORGANIZATION                                                                                                                                                                                                                |
| Actor                | TBD                                                                                                                                                                                                                         |
| Related terms        | atividades empresariais                                                                                                                                                                                                     |
| Candidate rule       | BR-003                                                                                                                                                                                                                      |
| Pending decision     | DDP-026                                                                                                                                                                                                                     |
| Conflict             | NONE                                                                                                                                                                                                                        |
| Notes                | Consolidação da lista §3; não implica escopo de release.                                                                                                                                                                    |

## EV-003

| Campo                | Valor                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-003                                                                                       |
| Source ID            | SRC-001                                                                                      |
| Source locator       | §3                                                                                           |
| Evidence statement   | A existência das atividades citadas não significa que todas farão parte do primeiro release. |
| Evidence type        | SCOPE_CONSTRAINT                                                                             |
| Temporal orientation | DESIRED_FUTURE                                                                               |
| Semantic status      | EXPLICIT_NON_COMMITMENT                                                                      |
| Modality             | DEONTIC                                                                                      |
| Confidence           | MEDIUM                                                                                       |
| Scope                | SCOPE                                                                                        |
| Domain               | DIRECTION                                                                                    |
| Actor                | TBD                                                                                          |
| Related terms        | primeiro release                                                                             |
| Candidate rule       | BR-020                                                                                       |
| Pending decision     | DDP-026                                                                                      |
| Conflict             | NONE                                                                                         |
| Notes                |                                                                                              |

## EV-004

| Campo                | Valor                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| Evidence ID          | EV-004                                                                               |
| Source ID            | SRC-001                                                                              |
| Source locator       | §3                                                                                   |
| Evidence statement   | A prioridade inicial das atividades precisa ser formalmente confirmada pela direção. |
| Evidence type        | OPEN_QUESTION                                                                        |
| Temporal orientation | DESIRED_FUTURE                                                                       |
| Semantic status      | DECISION_REQUIRED                                                                    |
| Modality             | DEONTIC                                                                              |
| Confidence           | MEDIUM                                                                               |
| Scope                | SCOPE                                                                                |
| Domain               | DIRECTION                                                                            |
| Actor                | TBD                                                                                  |
| Related terms        | prioridade; direção                                                                  |
| Candidate rule       | TBD                                                                                  |
| Pending decision     | DDP-026                                                                              |
| Conflict             | NONE                                                                                 |
| Notes                |                                                                                      |

## EV-005

| Campo                | Valor                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-005                                                                                                                                |
| Source ID            | SRC-001                                                                                                                               |
| Source locator       | §4                                                                                                                                    |
| Evidence statement   | Foi identificada necessidade de controlar o serviço desde a solicitação até a conclusão e possíveis efeitos comerciais e financeiros. |
| Evidence type        | OPERATIONAL_NEED                                                                                                                      |
| Temporal orientation | DESIRED_FUTURE                                                                                                                        |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                                             |
| Modality             | ASSERTIVE                                                                                                                             |
| Confidence           | MEDIUM                                                                                                                                |
| Scope                | PROCESS                                                                                                                               |
| Domain               | SYSTEM                                                                                                                                |
| Actor                | TBD                                                                                                                                   |
| Related terms        | solicitação; conclusão; comercial; financeiro                                                                                         |
| Candidate rule       | TBD                                                                                                                                   |
| Pending decision     | DDP-002                                                                                                                               |
| Conflict             | NONE                                                                                                                                  |
| Notes                | Necessidade, não processo confirmado.                                                                                                 |

## EV-006

| Campo                | Valor                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| Evidence ID          | EV-006                                                                               |
| Source ID            | SRC-001                                                                              |
| Source locator       | §4                                                                                   |
| Evidence statement   | Situação relatada como problema candidato: solicitação recebida sem controle formal. |
| Evidence type        | PROBLEM_CANDIDATE                                                                    |
| Temporal orientation | CURRENT_STATE                                                                        |
| Semantic status      | REPORTED_AS_IS                                                                       |
| Modality             | ASSERTIVE                                                                            |
| Confidence           | LOW                                                                                  |
| Scope                | PROCESS                                                                              |
| Domain               | OPERATIONS                                                                           |
| Actor                | TBD                                                                                  |
| Related terms        | solicitação; controle formal                                                         |
| Candidate rule       | BR-024                                                                               |
| Pending decision     | DDP-002                                                                              |
| Conflict             | NONE                                                                                 |
| Notes                | Ocorrência e frequência a confirmar.                                                 |

## EV-007

| Campo                | Valor                                                       |
| -------------------- | ----------------------------------------------------------- |
| Evidence ID          | EV-007                                                      |
| Source ID            | SRC-001                                                     |
| Source locator       | §4                                                          |
| Evidence statement   | Situação relatada: Ordem de Serviço aberta sem autorização. |
| Evidence type        | PROBLEM_CANDIDATE                                           |
| Temporal orientation | CURRENT_STATE                                               |
| Semantic status      | REPORTED_AS_IS                                              |
| Modality             | ASSERTIVE                                                   |
| Confidence           | LOW                                                         |
| Scope                | SERVICE_ORDER                                               |
| Domain               | OPERATIONS                                                  |
| Actor                | TBD                                                         |
| Related terms        | OS; autorização                                             |
| Candidate rule       | BR-006                                                      |
| Pending decision     | DDP-003                                                     |
| Conflict             | NONE                                                        |
| Notes                |                                                             |

## EV-008

| Campo                | Valor                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| Evidence ID          | EV-008                                                                              |
| Source ID            | SRC-001                                                                             |
| Source locator       | §4                                                                                  |
| Evidence statement   | Situação relatada: falta de informação sobre quanto tempo um processo ficou parado. |
| Evidence type        | PROBLEM_CANDIDATE                                                                   |
| Temporal orientation | CURRENT_STATE                                                                       |
| Semantic status      | REPORTED_AS_IS                                                                      |
| Modality             | ASSERTIVE                                                                           |
| Confidence           | LOW                                                                                 |
| Scope                | AGING                                                                               |
| Domain               | OPERATIONS                                                                          |
| Actor                | TBD                                                                                 |
| Related terms        | tempo parado; gargalo                                                               |
| Candidate rule       | BR-022                                                                              |
| Pending decision     | DDP-024                                                                             |
| Conflict             | NONE                                                                                |
| Notes                |                                                                                     |

## EV-009

| Campo                | Valor                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| Evidence ID          | EV-009                                                                     |
| Source ID            | SRC-001                                                                    |
| Source locator       | §4                                                                         |
| Evidence statement   | Situação relatada: ausência de ligação entre serviço executado e cobrança. |
| Evidence type        | PROBLEM_CANDIDATE                                                          |
| Temporal orientation | CURRENT_STATE                                                              |
| Semantic status      | REPORTED_AS_IS                                                             |
| Modality             | ASSERTIVE                                                                  |
| Confidence           | LOW                                                                        |
| Scope                | BILLING                                                                    |
| Domain               | FINANCE                                                                    |
| Actor                | TBD                                                                        |
| Related terms        | execução; cobrança                                                         |
| Candidate rule       | BR-009                                                                     |
| Pending decision     | DDP-011                                                                    |
| Conflict             | NONE                                                                       |
| Notes                |                                                                            |

## EV-010

| Campo                | Valor                                                             |
| -------------------- | ----------------------------------------------------------------- |
| Evidence ID          | EV-010                                                            |
| Source ID            | SRC-001                                                           |
| Source locator       | §4                                                                |
| Evidence statement   | Situação relatada: mão de obra registrada somente em observações. |
| Evidence type        | PROBLEM_CANDIDATE                                                 |
| Temporal orientation | CURRENT_STATE                                                     |
| Semantic status      | REPORTED_AS_IS                                                    |
| Modality             | ASSERTIVE                                                         |
| Confidence           | LOW                                                               |
| Scope                | LABOR                                                             |
| Domain               | OPERATIONS                                                        |
| Actor                | TBD                                                               |
| Related terms        | mão de obra; observações                                          |
| Candidate rule       | BR-012                                                            |
| Pending decision     | DDP-006                                                           |
| Conflict             | NONE                                                              |
| Notes                |                                                                   |

## EV-011

| Campo                | Valor                                                              |
| -------------------- | ------------------------------------------------------------------ |
| Evidence ID          | EV-011                                                             |
| Source ID            | SRC-001                                                            |
| Source locator       | §4                                                                 |
| Evidence statement   | Situação relatada: equipamento utilizado sem registro estruturado. |
| Evidence type        | PROBLEM_CANDIDATE                                                  |
| Temporal orientation | CURRENT_STATE                                                      |
| Semantic status      | REPORTED_AS_IS                                                     |
| Modality             | ASSERTIVE                                                          |
| Confidence           | LOW                                                                |
| Scope                | EQUIPMENT                                                          |
| Domain               | OPERATIONS                                                         |
| Actor                | TBD                                                                |
| Related terms        | equipamento; registro                                              |
| Candidate rule       | BR-011                                                             |
| Pending decision     | DDP-007                                                            |
| Conflict             | NONE                                                               |
| Notes                |                                                                    |

## EV-012

| Campo                | Valor                                                                         |
| -------------------- | ----------------------------------------------------------------------------- |
| Evidence ID          | EV-012                                                                        |
| Source ID            | SRC-001                                                                       |
| Source locator       | §4                                                                            |
| Evidence statement   | Situação relatada: dificuldade para separar custo da empresa e preço cobrado. |
| Evidence type        | PROBLEM_CANDIDATE                                                             |
| Temporal orientation | CURRENT_STATE                                                                 |
| Semantic status      | REPORTED_AS_IS                                                                |
| Modality             | ASSERTIVE                                                                     |
| Confidence           | LOW                                                                           |
| Scope                | PRICING                                                                       |
| Domain               | FINANCE                                                                       |
| Actor                | TBD                                                                           |
| Related terms        | custo; preço                                                                  |
| Candidate rule       | BR-008                                                                        |
| Pending decision     | DDP-030                                                                       |
| Conflict             | NONE                                                                          |
| Notes                |                                                                               |

## EV-013

| Campo                | Valor                                                                |
| -------------------- | -------------------------------------------------------------------- |
| Evidence ID          | EV-013                                                               |
| Source ID            | SRC-001                                                              |
| Source locator       | §4                                                                   |
| Evidence statement   | Situação relatada: documentos alterados por pessoas não autorizadas. |
| Evidence type        | PROBLEM_CANDIDATE                                                    |
| Temporal orientation | CURRENT_STATE                                                        |
| Semantic status      | REPORTED_AS_IS                                                       |
| Modality             | ASSERTIVE                                                            |
| Confidence           | LOW                                                                  |
| Scope                | DOCUMENT                                                             |
| Domain               | SECURITY                                                             |
| Actor                | TBD                                                                  |
| Related terms        | documento; alteração                                                 |
| Candidate rule       | BR-015                                                               |
| Pending decision     | DDP-015                                                              |
| Conflict             | NONE                                                                 |
| Notes                |                                                                      |

## EV-014

| Campo                | Valor                                                     |
| -------------------- | --------------------------------------------------------- |
| Evidence ID          | EV-014                                                    |
| Source ID            | SRC-001                                                   |
| Source locator       | §4                                                        |
| Evidence statement   | Situação relatada: perda de versão anterior de documento. |
| Evidence type        | PROBLEM_CANDIDATE                                         |
| Temporal orientation | CURRENT_STATE                                             |
| Semantic status      | REPORTED_AS_IS                                            |
| Modality             | ASSERTIVE                                                 |
| Confidence           | LOW                                                       |
| Scope                | DOCUMENT                                                  |
| Domain               | OPERATIONS                                                |
| Actor                | TBD                                                       |
| Related terms        | versão; documento                                         |
| Candidate rule       | BR-016                                                    |
| Pending decision     | DDP-013                                                   |
| Conflict             | NONE                                                      |
| Notes                |                                                           |

## EV-015

| Campo                | Valor                                                             |
| -------------------- | ----------------------------------------------------------------- |
| Evidence ID          | EV-015                                                            |
| Source ID            | SRC-001                                                           |
| Source locator       | §4                                                                |
| Evidence statement   | Situação relatada: cobrança de item não reconhecido pelo cliente. |
| Evidence type        | PROBLEM_CANDIDATE                                                 |
| Temporal orientation | CURRENT_STATE                                                     |
| Semantic status      | REPORTED_AS_IS                                                    |
| Modality             | ASSERTIVE                                                         |
| Confidence           | LOW                                                               |
| Scope                | BILLING                                                           |
| Domain               | COMMERCIAL                                                        |
| Actor                | TBD                                                               |
| Related terms        | cobrança; cliente                                                 |
| Candidate rule       | BR-009                                                            |
| Pending decision     | DDP-011                                                           |
| Conflict             | NONE                                                              |
| Notes                |                                                                   |

## EV-016

| Campo                | Valor                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| Evidence ID          | EV-016                                                                     |
| Source ID            | SRC-001                                                                    |
| Source locator       | §4                                                                         |
| Evidence statement   | Situação relatada: divergência entre pedido, PO, execução, medição e nota. |
| Evidence type        | PROBLEM_CANDIDATE                                                          |
| Temporal orientation | CURRENT_STATE                                                              |
| Semantic status      | REPORTED_AS_IS                                                             |
| Modality             | ASSERTIVE                                                                  |
| Confidence           | LOW                                                                        |
| Scope                | COMMERCIAL_CHAIN                                                           |
| Domain               | FINANCE                                                                    |
| Actor                | TBD                                                                        |
| Related terms        | pedido; PO; medição; nota                                                  |
| Candidate rule       | BR-002                                                                     |
| Pending decision     | DDP-009                                                                    |
| Conflict             | NONE                                                                       |
| Notes                |                                                                            |

## EV-017

| Campo                | Valor                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| Evidence ID          | EV-017                                                                                  |
| Source ID            | SRC-001                                                                                 |
| Source locator       | §4                                                                                      |
| Evidence statement   | Situação relatada: dificuldade para identificar gargalos e valores ainda não recebidos. |
| Evidence type        | PROBLEM_CANDIDATE                                                                       |
| Temporal orientation | CURRENT_STATE                                                                           |
| Semantic status      | REPORTED_AS_IS                                                                          |
| Modality             | ASSERTIVE                                                                               |
| Confidence           | LOW                                                                                     |
| Scope                | AGING                                                                                   |
| Domain               | FINANCE                                                                                 |
| Actor                | TBD                                                                                     |
| Related terms        | gargalo; recebíveis                                                                     |
| Candidate rule       | TBD                                                                                     |
| Pending decision     | DDP-024                                                                                 |
| Conflict             | NONE                                                                                    |
| Notes                |                                                                                         |

## EV-018

| Campo                | Valor                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-018                                                                                                  |
| Source ID            | SRC-001                                                                                                 |
| Source locator       | §4                                                                                                      |
| Evidence statement   | Os problemas listados são candidatos de investigação; ocorrência e frequência precisam ser confirmadas. |
| Evidence type        | METHODOLOGY                                                                                             |
| Temporal orientation | TIMELESS                                                                                                |
| Semantic status      | EXPLICIT_CAVEAT                                                                                         |
| Modality             | DEONTIC                                                                                                 |
| Confidence           | HIGH                                                                                                    |
| Scope                | DISCOVERY                                                                                               |
| Domain               | SYSTEM                                                                                                  |
| Actor                | TBD                                                                                                     |
| Related terms        | investigação; confirmação                                                                               |
| Candidate rule       | BR-024                                                                                                  |
| Pending decision     | TBD                                                                                                     |
| Conflict             | NONE                                                                                                    |
| Notes                |                                                                                                         |

## EV-019

| Campo                | Valor                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Evidence ID          | EV-019                                                                                                                               |
| Source ID            | SRC-001                                                                                                                              |
| Source locator       | §5                                                                                                                                   |
| Evidence statement   | Processo atual relatado: pessoa pode entrar em contato, inclusive por WhatsApp, informando necessidade de serviço ou abertura de OS. |
| Evidence type        | PROCESS_FACT                                                                                                                         |
| Temporal orientation | CURRENT_STATE                                                                                                                        |
| Semantic status      | REPORTED_AS_IS                                                                                                                       |
| Modality             | ASSERTIVE                                                                                                                            |
| Confidence           | MEDIUM                                                                                                                               |
| Scope                | SERVICE_REQUEST                                                                                                                      |
| Domain               | REQUESTER                                                                                                                            |
| Actor                | TBD                                                                                                                                  |
| Related terms        | WhatsApp; solicitação; OS                                                                                                            |
| Candidate rule       | BR-005                                                                                                                               |
| Pending decision     | DDP-021                                                                                                                              |
| Conflict             | NONE                                                                                                                                 |
| Notes                |                                                                                                                                      |

## EV-020

| Campo                | Valor                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Evidence ID          | EV-020                                                                                     |
| Source ID            | SRC-001                                                                                    |
| Source locator       | §5                                                                                         |
| Evidence statement   | A solicitação recebida não deve ser tratada automaticamente como Ordem de Serviço oficial. |
| Evidence type        | PRELIMINARY_RULE                                                                           |
| Temporal orientation | DESIRED_FUTURE                                                                             |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                  |
| Modality             | DEONTIC                                                                                    |
| Confidence           | MEDIUM                                                                                     |
| Scope                | SERVICE_REQUEST                                                                            |
| Domain               | SYSTEM                                                                                     |
| Actor                | TBD                                                                                        |
| Related terms        | solicitação; OS                                                                            |
| Candidate rule       | BR-001                                                                                     |
| Pending decision     | DDP-002                                                                                    |
| Conflict             | NONE                                                                                       |
| Notes                | Alinha BR-001 com evidência SRC-001.                                                       |

## EV-021

| Campo                | Valor                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| Evidence ID          | EV-021                                                                                  |
| Source ID            | SRC-001                                                                                 |
| Source locator       | §5                                                                                      |
| Evidence statement   | Pendente confirmar quem pode solicitar serviço e se o solicitante é interno ou externo. |
| Evidence type        | OPEN_QUESTION                                                                           |
| Temporal orientation | UNKNOWN                                                                                 |
| Semantic status      | DECISION_REQUIRED                                                                       |
| Modality             | INTERROGATIVE                                                                           |
| Confidence           | LOW                                                                                     |
| Scope                | SERVICE_REQUEST                                                                         |
| Domain               | REQUESTER                                                                               |
| Actor                | TBD                                                                                     |
| Related terms        | solicitante; interno; externo                                                           |
| Candidate rule       | TBD                                                                                     |
| Pending decision     | DDP-028                                                                                 |
| Conflict             | NONE                                                                                    |
| Notes                |                                                                                         |

## EV-022

| Campo                | Valor                                                       |
| -------------------- | ----------------------------------------------------------- |
| Evidence ID          | EV-022                                                      |
| Source ID            | SRC-001                                                     |
| Source locator       | §5                                                          |
| Evidence statement   | Pendente confirmar quais canais de solicitação são aceitos. |
| Evidence type        | OPEN_QUESTION                                               |
| Temporal orientation | UNKNOWN                                                     |
| Semantic status      | DECISION_REQUIRED                                           |
| Modality             | INTERROGATIVE                                               |
| Confidence           | LOW                                                         |
| Scope                | SERVICE_REQUEST                                             |
| Domain               | CHANNEL                                                     |
| Actor                | TBD                                                         |
| Related terms        | canais                                                      |
| Candidate rule       | BR-005                                                      |
| Pending decision     | DDP-021                                                     |
| Conflict             | NONE                                                        |
| Notes                |                                                             |

## EV-023

| Campo                | Valor                                                          |
| -------------------- | -------------------------------------------------------------- |
| Evidence ID          | EV-023                                                         |
| Source ID            | SRC-001                                                        |
| Source locator       | §5                                                             |
| Evidence statement   | Pendente confirmar se WhatsApp continuará sendo canal oficial. |
| Evidence type        | OPEN_QUESTION                                                  |
| Temporal orientation | DESIRED_FUTURE                                                 |
| Semantic status      | DECISION_REQUIRED                                              |
| Modality             | INTERROGATIVE                                                  |
| Confidence           | LOW                                                            |
| Scope                | SERVICE_REQUEST                                                |
| Domain               | CHANNEL                                                        |
| Actor                | TBD                                                            |
| Related terms        | WhatsApp; canal oficial                                        |
| Candidate rule       | BR-005                                                         |
| Pending decision     | DDP-021                                                        |
| Conflict             | NONE                                                           |
| Notes                |                                                                |

## EV-024

| Campo                | Valor                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Evidence ID          | EV-024                                                                                   |
| Source ID            | SRC-001                                                                                  |
| Source locator       | §5                                                                                       |
| Evidence statement   | Pendente confirmar se o sistema substituirá ou apenas registrará a conversa do WhatsApp. |
| Evidence type        | OPEN_QUESTION                                                                            |
| Temporal orientation | DESIRED_FUTURE                                                                           |
| Semantic status      | DECISION_REQUIRED                                                                        |
| Modality             | INTERROGATIVE                                                                            |
| Confidence           | LOW                                                                                      |
| Scope                | INTEGRATION                                                                              |
| Domain               | CHANNEL                                                                                  |
| Actor                | TBD                                                                                      |
| Related terms        | WhatsApp; registro                                                                       |
| Candidate rule       | TBD                                                                                      |
| Pending decision     | DDP-033                                                                                  |
| Conflict             | NONE                                                                                     |
| Notes                |                                                                                          |

## EV-025

| Campo                | Valor                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-025                                                                                              |
| Source ID            | SRC-001                                                                                             |
| Source locator       | §5                                                                                                  |
| Evidence statement   | Pendente confirmar se existe aprovação ou rejeição de solicitação e motivo obrigatório de rejeição. |
| Evidence type        | OPEN_QUESTION                                                                                       |
| Temporal orientation | UNKNOWN                                                                                             |
| Semantic status      | DECISION_REQUIRED                                                                                   |
| Modality             | INTERROGATIVE                                                                                       |
| Confidence           | LOW                                                                                                 |
| Scope                | SERVICE_REQUEST                                                                                     |
| Domain               | APPROVAL                                                                                            |
| Actor                | TBD                                                                                                 |
| Related terms        | aprovação; rejeição                                                                                 |
| Candidate rule       | TBD                                                                                                 |
| Pending decision     | DDP-002                                                                                             |
| Conflict             | NONE                                                                                                |
| Notes                |                                                                                                     |

## EV-026

| Campo                | Valor                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-026                                                                                                                    |
| Source ID            | SRC-001                                                                                                                   |
| Source locator       | §6                                                                                                                        |
| Evidence statement   | Preocupação manifestada: usuários operacionais não devem ter liberdade irrestrita para abrir e liberar Ordens de Serviço. |
| Evidence type        | SECURITY_CONCERN                                                                                                          |
| Temporal orientation | DESIRED_FUTURE                                                                                                            |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                                 |
| Modality             | DEONTIC                                                                                                                   |
| Confidence           | MEDIUM                                                                                                                    |
| Scope                | SERVICE_ORDER                                                                                                             |
| Domain               | OPERATIONS                                                                                                                |
| Actor                | TBD                                                                                                                       |
| Related terms        | liberação; OS                                                                                                             |
| Candidate rule       | BR-006                                                                                                                    |
| Pending decision     | DDP-003                                                                                                                   |
| Conflict             | NONE                                                                                                                      |
| Notes                |                                                                                                                           |

## EV-027

| Campo                | Valor                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| Evidence ID          | EV-027                                                                 |
| Source ID            | SRC-001                                                                |
| Source locator       | §6                                                                     |
| Evidence statement   | Entendimento preliminar: executor pode informar que precisa de uma OS. |
| Evidence type        | PROCESS_FACT                                                           |
| Temporal orientation | CURRENT_STATE                                                          |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                              |
| Modality             | ASSERTIVE                                                              |
| Confidence           | MEDIUM                                                                 |
| Scope                | SERVICE_ORDER                                                          |
| Domain               | EXECUTOR                                                               |
| Actor                | EXECUTOR                                                               |
| Related terms        | solicitação; executor                                                  |
| Candidate rule       | BR-006                                                                 |
| Pending decision     | DDP-003                                                                |
| Conflict             | NONE                                                                   |
| Notes                |                                                                        |

## EV-028

| Campo                | Valor                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| Evidence ID          | EV-028                                                                     |
| Source ID            | SRC-001                                                                    |
| Source locator       | §6                                                                         |
| Evidence statement   | Entendimento preliminar: solicitação será analisada por pessoa autorizada. |
| Evidence type        | PROCESS_FACT                                                               |
| Temporal orientation | DESIRED_FUTURE                                                             |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                  |
| Modality             | ASSERTIVE                                                                  |
| Confidence           | MEDIUM                                                                     |
| Scope                | SERVICE_ORDER                                                              |
| Domain               | AUTHORIZER                                                                 |
| Actor                | AUTHORIZER                                                                 |
| Related terms        | análise; autorização                                                       |
| Candidate rule       | BR-006                                                                     |
| Pending decision     | DDP-003                                                                    |
| Conflict             | NONE                                                                       |
| Notes                |                                                                            |

## EV-029

| Campo                | Valor                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Evidence ID          | EV-029                                                                                           |
| Source ID            | SRC-001                                                                                          |
| Source locator       | §6                                                                                               |
| Evidence statement   | Entendimento preliminar: OS oficial será aberta ou liberada somente mediante decisão autorizada. |
| Evidence type        | PRELIMINARY_RULE                                                                                 |
| Temporal orientation | DESIRED_FUTURE                                                                                   |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                        |
| Modality             | DEONTIC                                                                                          |
| Confidence           | MEDIUM                                                                                           |
| Scope                | SERVICE_ORDER                                                                                    |
| Domain               | AUTHORIZER                                                                                       |
| Actor                | AUTHORIZER                                                                                       |
| Related terms        | liberação; OS                                                                                    |
| Candidate rule       | BR-006                                                                                           |
| Pending decision     | DDP-003                                                                                          |
| Conflict             | NONE                                                                                             |
| Notes                |                                                                                                  |

## EV-030

| Campo                | Valor                                                                |
| -------------------- | -------------------------------------------------------------------- |
| Evidence ID          | EV-030                                                               |
| Source ID            | SRC-001                                                              |
| Source locator       | §6                                                                   |
| Evidence statement   | Entendimento preliminar: executor receberá a OS depois da liberação. |
| Evidence type        | PROCESS_FACT                                                         |
| Temporal orientation | DESIRED_FUTURE                                                       |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                            |
| Modality             | ASSERTIVE                                                            |
| Confidence           | MEDIUM                                                               |
| Scope                | SERVICE_ORDER                                                        |
| Domain               | EXECUTOR                                                             |
| Actor                | EXECUTOR                                                             |
| Related terms        | handoff; OS                                                          |
| Candidate rule       | TBD                                                                  |
| Pending decision     | DDP-003                                                              |
| Conflict             | NONE                                                                 |
| Notes                |                                                                      |

## EV-031

| Campo                | Valor                                                        |
| -------------------- | ------------------------------------------------------------ |
| Evidence ID          | EV-031                                                       |
| Source ID            | SRC-001                                                      |
| Source locator       | §6                                                           |
| Evidence statement   | Entendimento preliminar: solicitar não equivale a autorizar. |
| Evidence type        | PRELIMINARY_RULE                                             |
| Temporal orientation | TIMELESS                                                     |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                    |
| Modality             | DEONTIC                                                      |
| Confidence           | MEDIUM                                                       |
| Scope                | SERVICE_ORDER                                                |
| Domain               | SYSTEM                                                       |
| Actor                | TBD                                                          |
| Related terms        | solicitar; autorizar                                         |
| Candidate rule       | BR-025                                                       |
| Pending decision     | DDP-003                                                      |
| Conflict             | NONE                                                         |
| Notes                |                                                              |

## EV-032

| Campo                | Valor                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| Evidence ID          | EV-032                                                                                  |
| Source ID            | SRC-001                                                                                 |
| Source locator       | §6                                                                                      |
| Evidence statement   | Entendimento preliminar: criar rascunho não deve ser confundido com liberar a execução. |
| Evidence type        | PRELIMINARY_RULE                                                                        |
| Temporal orientation | TIMELESS                                                                                |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                               |
| Modality             | DEONTIC                                                                                 |
| Confidence           | MEDIUM                                                                                  |
| Scope                | SERVICE_ORDER                                                                           |
| Domain               | SYSTEM                                                                                  |
| Actor                | TBD                                                                                     |
| Related terms        | rascunho; liberação                                                                     |
| Candidate rule       | BR-007                                                                                  |
| Pending decision     | DDP-022                                                                                 |
| Conflict             | NONE                                                                                    |
| Notes                |                                                                                         |

## EV-033

| Campo                | Valor                                                                            |
| -------------------- | -------------------------------------------------------------------------------- |
| Evidence ID          | EV-033                                                                           |
| Source ID            | SRC-001                                                                          |
| Source locator       | §6                                                                               |
| Evidence statement   | Pendente confirmar se criar e liberar OS podem ser realizados pela mesma pessoa. |
| Evidence type        | OPEN_QUESTION                                                                    |
| Temporal orientation | UNKNOWN                                                                          |
| Semantic status      | DECISION_REQUIRED                                                                |
| Modality             | INTERROGATIVE                                                                    |
| Confidence           | LOW                                                                              |
| Scope                | SERVICE_ORDER                                                                    |
| Domain               | AUTHORIZER                                                                       |
| Actor                | TBD                                                                              |
| Related terms        | segregação; liberação                                                            |
| Candidate rule       | TBD                                                                              |
| Pending decision     | DDP-022                                                                          |
| Conflict             | NONE                                                                             |
| Notes                |                                                                                  |

## EV-034

| Campo                | Valor                                                               |
| -------------------- | ------------------------------------------------------------------- |
| Evidence ID          | EV-034                                                              |
| Source ID            | SRC-001                                                             |
| Source locator       | §6                                                                  |
| Evidence statement   | Pendente confirmar condições que tornam a OS pronta para liberação. |
| Evidence type        | OPEN_QUESTION                                                       |
| Temporal orientation | UNKNOWN                                                             |
| Semantic status      | DECISION_REQUIRED                                                   |
| Modality             | INTERROGATIVE                                                       |
| Confidence           | LOW                                                                 |
| Scope                | SERVICE_ORDER                                                       |
| Domain               | AUTHORIZER                                                          |
| Actor                | TBD                                                                 |
| Related terms        | prontidão; liberação                                                |
| Candidate rule       | TBD                                                                 |
| Pending decision     | DDP-029                                                             |
| Conflict             | NONE                                                                |
| Notes                |                                                                     |

## EV-035

| Campo                | Valor                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-035                                                                                             |
| Source ID            | SRC-001                                                                                            |
| Source locator       | §7                                                                                                 |
| Evidence statement   | O sistema deverá ser estudado para permitir que a OS represente o serviço planejado ou autorizado. |
| Evidence type        | FUTURE_CAPABILITY                                                                                  |
| Temporal orientation | DESIRED_FUTURE                                                                                     |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                          |
| Modality             | ASSERTIVE                                                                                          |
| Confidence           | MEDIUM                                                                                             |
| Scope                | SERVICE_ORDER                                                                                      |
| Domain               | SYSTEM                                                                                             |
| Actor                | TBD                                                                                                |
| Related terms        | OS; planejamento                                                                                   |
| Candidate rule       | TBD                                                                                                |
| Pending decision     | DDP-001                                                                                            |
| Conflict             | NONE                                                                                               |
| Notes                | Capacidade futura, não requisito confirmado.                                                       |

## EV-036

| Campo                | Valor                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-036                                                                                                                                                                                                        |
| Source ID            | SRC-001                                                                                                                                                                                                       |
| Source locator       | §7                                                                                                                                                                                                            |
| Evidence statement   | Informações operacionais citadas para OS incluem cliente, local, descrição, período, equipamentos, veículos, mão de obra, materiais, deslocamentos, diárias, horas, custos, preços, documentos e observações. |
| Evidence type        | FIELD_CANDIDATE                                                                                                                                                                                               |
| Temporal orientation | DESIRED_FUTURE                                                                                                                                                                                                |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                                                                                                                     |
| Modality             | ASSERTIVE                                                                                                                                                                                                     |
| Confidence           | MEDIUM                                                                                                                                                                                                        |
| Scope                | SERVICE_ORDER                                                                                                                                                                                                 |
| Domain               | OPERATIONS                                                                                                                                                                                                    |
| Actor                | TBD                                                                                                                                                                                                           |
| Related terms        | campos OS                                                                                                                                                                                                     |
| Candidate rule       | TBD                                                                                                                                                                                                           |
| Pending decision     | DDP-035                                                                                                                                                                                                       |
| Conflict             | NONE                                                                                                                                                                                                          |
| Notes                | Lista não confirma obrigatoriedade universal.                                                                                                                                                                 |

## EV-037

| Campo                | Valor                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-037                                                                                             |
| Source ID            | SRC-001                                                                                            |
| Source locator       | §7                                                                                                 |
| Evidence statement   | Não está confirmado que todos os campos citados sejam obrigatórios para todos os tipos de serviço. |
| Evidence type        | SCOPE_CONSTRAINT                                                                                   |
| Temporal orientation | TIMELESS                                                                                           |
| Semantic status      | EXPLICIT_NON_COMMITMENT                                                                            |
| Modality             | DEONTIC                                                                                            |
| Confidence           | MEDIUM                                                                                             |
| Scope                | SERVICE_ORDER                                                                                      |
| Domain               | SYSTEM                                                                                             |
| Actor                | TBD                                                                                                |
| Related terms        | obrigatoriedade; tipo serviço                                                                      |
| Candidate rule       | TBD                                                                                                |
| Pending decision     | DDP-035                                                                                            |
| Conflict             | NONE                                                                                               |
| Notes                |                                                                                                    |

## EV-038

| Campo                | Valor                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-038                                                                                                |
| Source ID            | SRC-001                                                                                               |
| Source locator       | §8                                                                                                    |
| Evidence statement   | Necessidade relatada de informar quais máquinas ou equipamentos serão necessários e suas quantidades. |
| Evidence type        | OPERATIONAL_NEED                                                                                      |
| Temporal orientation | DESIRED_FUTURE                                                                                        |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                             |
| Modality             | ASSERTIVE                                                                                             |
| Confidence           | MEDIUM                                                                                                |
| Scope                | EQUIPMENT                                                                                             |
| Domain               | OPERATIONS                                                                                            |
| Actor                | TBD                                                                                                   |
| Related terms        | equipamento; quantidade                                                                               |
| Candidate rule       | BR-011                                                                                                |
| Pending decision     | DDP-007                                                                                               |
| Conflict             | NONE                                                                                                  |
| Notes                |                                                                                                       |

## EV-039

| Campo                | Valor                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Evidence ID          | EV-039                                                                                                       |
| Source ID            | SRC-001                                                                                                      |
| Source locator       | §8                                                                                                           |
| Evidence statement   | Devem ser diferenciados tipo de equipamento, equipamento físico específico, veículo e categoria operacional. |
| Evidence type        | PRELIMINARY_RULE                                                                                             |
| Temporal orientation | DESIRED_FUTURE                                                                                               |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                    |
| Modality             | DEONTIC                                                                                                      |
| Confidence           | MEDIUM                                                                                                       |
| Scope                | EQUIPMENT                                                                                                    |
| Domain               | SYSTEM                                                                                                       |
| Actor                | TBD                                                                                                          |
| Related terms        | tipo; físico; veículo                                                                                        |
| Candidate rule       | BR-011                                                                                                       |
| Pending decision     | DDP-007                                                                                                      |
| Conflict             | NONE                                                                                                         |
| Notes                |                                                                                                              |

## EV-040

| Campo                | Valor                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-040                                                                                            |
| Source ID            | SRC-001                                                                                           |
| Source locator       | §8                                                                                                |
| Evidence statement   | Devem ser diferenciadas quantidade planejada, alocada e efetivamente utilizada para equipamentos. |
| Evidence type        | PRELIMINARY_RULE                                                                                  |
| Temporal orientation | DESIRED_FUTURE                                                                                    |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                         |
| Modality             | DEONTIC                                                                                           |
| Confidence           | MEDIUM                                                                                            |
| Scope                | QUANTITY                                                                                          |
| Domain               | OPERATIONS                                                                                        |
| Actor                | TBD                                                                                               |
| Related terms        | planejada; alocada; utilizada                                                                     |
| Candidate rule       | BR-010                                                                                            |
| Pending decision     | DDP-007                                                                                           |
| Conflict             | NONE                                                                                              |
| Notes                |                                                                                                   |

## EV-041

| Campo                | Valor                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-041                                                                                                    |
| Source ID            | SRC-001                                                                                                   |
| Source locator       | §8                                                                                                        |
| Evidence statement   | Pendente confirmar necessidade de campos como placa, prefixo, chassi, RENAVAM, quilometragem e horímetro. |
| Evidence type        | OPEN_QUESTION                                                                                             |
| Temporal orientation | UNKNOWN                                                                                                   |
| Semantic status      | DECISION_REQUIRED                                                                                         |
| Modality             | INTERROGATIVE                                                                                             |
| Confidence           | LOW                                                                                                       |
| Scope                | EQUIPMENT                                                                                                 |
| Domain               | FLEET                                                                                                     |
| Actor                | TBD                                                                                                       |
| Related terms        | placa; chassi; RENAVAM                                                                                    |
| Candidate rule       | TBD                                                                                                       |
| Pending decision     | DDP-034                                                                                                   |
| Conflict             | NONE                                                                                                      |
| Notes                |                                                                                                           |

## EV-042

| Campo                | Valor                                                              |
| -------------------- | ------------------------------------------------------------------ |
| Evidence ID          | EV-042                                                             |
| Source ID            | SRC-001                                                            |
| Source locator       | §8                                                                 |
| Evidence statement   | Não deverá ser criado cadastro patrimonial completo sem validação. |
| Evidence type        | PROHIBITION                                                        |
| Temporal orientation | DESIRED_FUTURE                                                     |
| Semantic status      | EXPLICIT_CONSTRAINT                                                |
| Modality             | DEONTIC                                                            |
| Confidence           | HIGH                                                               |
| Scope                | EQUIPMENT                                                          |
| Domain               | SYSTEM                                                             |
| Actor                | TBD                                                                |
| Related terms        | cadastro patrimonial                                               |
| Candidate rule       | BR-017                                                             |
| Pending decision     | DDP-007                                                            |
| Conflict             | NONE                                                               |
| Notes                |                                                                    |

## EV-043

| Campo                | Valor                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-043                                                                                             |
| Source ID            | SRC-001                                                                                            |
| Source locator       | §9                                                                                                 |
| Evidence statement   | Tipos de mão de obra mencionados: ajudante, motorista, operador, supervisor e outros relacionados. |
| Evidence type        | FIELD_CANDIDATE                                                                                    |
| Temporal orientation | DESIRED_FUTURE                                                                                     |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                          |
| Modality             | ASSERTIVE                                                                                          |
| Confidence           | MEDIUM                                                                                             |
| Scope                | LABOR                                                                                              |
| Domain               | OPERATIONS                                                                                         |
| Actor                | TBD                                                                                                |
| Related terms        | ajudante; motorista; operador                                                                      |
| Candidate rule       | BR-012                                                                                             |
| Pending decision     | DDP-006                                                                                            |
| Conflict             | NONE                                                                                               |
| Notes                |                                                                                                    |

## EV-044

| Campo                | Valor                                                        |
| -------------------- | ------------------------------------------------------------ |
| Evidence ID          | EV-044                                                       |
| Source ID            | SRC-001                                                      |
| Source locator       | §9                                                           |
| Evidence statement   | Deve-se diferenciar TIPO DE MÃO DE OBRA de PESSOA EXECUTORA. |
| Evidence type        | PRELIMINARY_RULE                                             |
| Temporal orientation | DESIRED_FUTURE                                               |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                    |
| Modality             | DEONTIC                                                      |
| Confidence           | MEDIUM                                                       |
| Scope                | LABOR                                                        |
| Domain               | SYSTEM                                                       |
| Actor                | TBD                                                          |
| Related terms        | tipo; pessoa executora                                       |
| Candidate rule       | BR-012                                                       |
| Pending decision     | DDP-006                                                      |
| Conflict             | NONE                                                         |
| Notes                |                                                              |

## EV-045

| Campo                | Valor                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-045                                                                                                                          |
| Source ID            | SRC-001                                                                                                                         |
| Source locator       | §9                                                                                                                              |
| Evidence statement   | Serviço pode ser planejado com quantidade ou tipo de mão de obra sem pessoa executora já escolhida — possibilidade a confirmar. |
| Evidence type        | HYPOTHESIS                                                                                                                      |
| Temporal orientation | DESIRED_FUTURE                                                                                                                  |
| Semantic status      | DECISION_REQUIRED                                                                                                               |
| Modality             | ASSERTIVE                                                                                                                       |
| Confidence           | LOW                                                                                                                             |
| Scope                | LABOR                                                                                                                           |
| Domain               | OPERATIONS                                                                                                                      |
| Actor                | TBD                                                                                                                             |
| Related terms        | planejamento; alocação                                                                                                          |
| Candidate rule       | BR-012                                                                                                                          |
| Pending decision     | DDP-006                                                                                                                         |
| Conflict             | NONE                                                                                                                            |
| Notes                |                                                                                                                                 |

## EV-046

| Campo                | Valor                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-046                                                                                            |
| Source ID            | SRC-001                                                                                           |
| Source locator       | §9                                                                                                |
| Evidence statement   | Pendente definir unidades de cobrança de mão de obra (hora, diária, turno, presença, hora extra). |
| Evidence type        | OPEN_QUESTION                                                                                     |
| Temporal orientation | UNKNOWN                                                                                           |
| Semantic status      | DECISION_REQUIRED                                                                                 |
| Modality             | INTERROGATIVE                                                                                     |
| Confidence           | LOW                                                                                               |
| Scope                | LABOR                                                                                             |
| Domain               | FINANCE                                                                                           |
| Actor                | TBD                                                                                               |
| Related terms        | hora; diária; turno                                                                               |
| Candidate rule       | TBD                                                                                               |
| Pending decision     | DDP-030                                                                                           |
| Conflict             | NONE                                                                                              |
| Notes                |                                                                                                   |

## EV-047

| Campo                | Valor                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Evidence ID          | EV-047                                                                                           |
| Source ID            | SRC-001                                                                                          |
| Source locator       | §10                                                                                              |
| Evidence statement   | Necessidade relatada de visualizar recursos usados, custo da empresa e valor cobrado do cliente. |
| Evidence type        | OPERATIONAL_NEED                                                                                 |
| Temporal orientation | DESIRED_FUTURE                                                                                   |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                        |
| Modality             | ASSERTIVE                                                                                        |
| Confidence           | MEDIUM                                                                                           |
| Scope                | PRICING                                                                                          |
| Domain               | FINANCE                                                                                          |
| Actor                | TBD                                                                                              |
| Related terms        | custo; preço; recursos                                                                           |
| Candidate rule       | BR-008                                                                                           |
| Pending decision     | DDP-030                                                                                          |
| Conflict             | NONE                                                                                             |
| Notes                |                                                                                                  |

## EV-048

| Campo                | Valor                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| Evidence ID          | EV-048                                                                      |
| Source ID            | SRC-001                                                                     |
| Source locator       | §10                                                                         |
| Evidence statement   | CUSTO INTERNO e PREÇO COMERCIAL devem permanecer conceitualmente separados. |
| Evidence type        | PRELIMINARY_RULE                                                            |
| Temporal orientation | TIMELESS                                                                    |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                   |
| Modality             | DEONTIC                                                                     |
| Confidence           | MEDIUM                                                                      |
| Scope                | PRICING                                                                     |
| Domain               | SYSTEM                                                                      |
| Actor                | TBD                                                                         |
| Related terms        | custo interno; preço comercial                                              |
| Candidate rule       | BR-008                                                                      |
| Pending decision     | DDP-030                                                                     |
| Conflict             | NONE                                                                        |
| Notes                |                                                                             |

## EV-049

| Campo                | Valor                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| Evidence ID          | EV-049                                                                 |
| Source ID            | SRC-001                                                                |
| Source locator       | §10                                                                    |
| Evidence statement   | Não está definido quem pode visualizar custo, margem ou alterar preço. |
| Evidence type        | OPEN_QUESTION                                                          |
| Temporal orientation | UNKNOWN                                                                |
| Semantic status      | DECISION_REQUIRED                                                      |
| Modality             | INTERROGATIVE                                                          |
| Confidence           | LOW                                                                    |
| Scope                | PRICING                                                                |
| Domain               | AUTHORIZATION                                                          |
| Actor                | TBD                                                                    |
| Related terms        | custo; margem; preço                                                   |
| Candidate rule       | TBD                                                                    |
| Pending decision     | DDP-030                                                                |
| Conflict             | NONE                                                                   |
| Notes                |                                                                        |

## EV-050

| Campo                | Valor                                                       |
| -------------------- | ----------------------------------------------------------- |
| Evidence ID          | EV-050                                                      |
| Source ID            | SRC-001                                                     |
| Source locator       | §10                                                         |
| Evidence statement   | Não está definido se o preço é global, por item ou híbrido. |
| Evidence type        | OPEN_QUESTION                                               |
| Temporal orientation | UNKNOWN                                                     |
| Semantic status      | DECISION_REQUIRED                                           |
| Modality             | INTERROGATIVE                                               |
| Confidence           | LOW                                                         |
| Scope                | PRICING                                                     |
| Domain               | COMMERCIAL                                                  |
| Actor                | TBD                                                         |
| Related terms        | preço global; item                                          |
| Candidate rule       | TBD                                                         |
| Pending decision     | DDP-031                                                     |
| Conflict             | NONE                                                        |
| Notes                |                                                             |

## EV-051

| Campo                | Valor                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| Evidence ID          | EV-051                                                                               |
| Source ID            | SRC-001                                                                              |
| Source locator       | §11                                                                                  |
| Evidence statement   | Necessidade preliminar: tudo que possa gerar cobrança deve ter origem identificável. |
| Evidence type        | PRELIMINARY_RULE                                                                     |
| Temporal orientation | DESIRED_FUTURE                                                                       |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                            |
| Modality             | DEONTIC                                                                              |
| Confidence           | MEDIUM                                                                               |
| Scope                | BILLING                                                                              |
| Domain               | FINANCE                                                                              |
| Actor                | TBD                                                                                  |
| Related terms        | origem; cobrança                                                                     |
| Candidate rule       | BR-009                                                                               |
| Pending decision     | DDP-011                                                                              |
| Conflict             | NONE                                                                                 |
| Notes                |                                                                                      |

## EV-052

| Campo                | Valor                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-052                                                                                                                                                          |
| Source ID            | SRC-001                                                                                                                                                         |
| Source locator       | §11                                                                                                                                                             |
| Evidence statement   | Origem de cobrança pode relacionar-se a proposta, contrato, pedido, PO, item OS, recurso planejado/autorizado/executado, evidência, medição ou ajuste aprovado. |
| Evidence type        | FIELD_CANDIDATE                                                                                                                                                 |
| Temporal orientation | DESIRED_FUTURE                                                                                                                                                  |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                                                                       |
| Modality             | ASSERTIVE                                                                                                                                                       |
| Confidence           | MEDIUM                                                                                                                                                          |
| Scope                | BILLING                                                                                                                                                         |
| Domain               | COMMERCIAL_CHAIN                                                                                                                                                |
| Actor                | TBD                                                                                                                                                             |
| Related terms        | origem rastreável                                                                                                                                               |
| Candidate rule       | BR-009                                                                                                                                                          |
| Pending decision     | DDP-020                                                                                                                                                         |
| Conflict             | NONE                                                                                                                                                            |
| Notes                | Não confirma obrigatoriedade de todos os passos.                                                                                                                |

## EV-053

| Campo                | Valor                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Evidence ID          | EV-053                                                                |
| Source ID            | SRC-001                                                               |
| Source locator       | §11                                                                   |
| Evidence statement   | Levantamento futuro deve distinguir fases ITEM_PLANNED até ITEM_PAID. |
| Evidence type        | ENGINEERING_GUIDANCE                                                  |
| Temporal orientation | DESIRED_FUTURE                                                        |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                             |
| Modality             | DEONTIC                                                               |
| Confidence           | MEDIUM                                                                |
| Scope                | QUANTITY                                                              |
| Domain               | SYSTEM                                                                |
| Actor                | TBD                                                                   |
| Related terms        | ITEM_PLANNED; ITEM_PAID                                               |
| Candidate rule       | BR-010                                                                |
| Pending decision     | TBD                                                                   |
| Conflict             | NONE                                                                  |
| Notes                |                                                                       |

## EV-054

| Campo                | Valor                                                                         |
| -------------------- | ----------------------------------------------------------------------------- |
| Evidence ID          | EV-054                                                                        |
| Source ID            | SRC-001                                                                       |
| Source locator       | §11                                                                           |
| Evidence statement   | Proibição de criar propriedade genérica quantity para todas as fases de item. |
| Evidence type        | PROHIBITION                                                                   |
| Temporal orientation | DESIRED_FUTURE                                                                |
| Semantic status      | EXPLICIT_CONSTRAINT                                                           |
| Modality             | DEONTIC                                                                       |
| Confidence           | HIGH                                                                          |
| Scope                | QUANTITY                                                                      |
| Domain               | SYSTEM                                                                        |
| Actor                | TBD                                                                           |
| Related terms        | quantity; fases                                                               |
| Candidate rule       | BR-010                                                                        |
| Pending decision     | TBD                                                                           |
| Conflict             | NONE                                                                          |
| Notes                |                                                                               |

## EV-055

| Campo                | Valor                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-055                                                                                                                                              |
| Source ID            | SRC-001                                                                                                                                             |
| Source locator       | §12                                                                                                                                                 |
| Evidence statement   | Conceitos mencionados na cadeia comercial: proposta, pedido, PO, contrato, solicitação, OS, execução, medição, faturamento, nota/fatura, pagamento. |
| Evidence type        | FIELD_CANDIDATE                                                                                                                                     |
| Temporal orientation | DESIRED_FUTURE                                                                                                                                      |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                                                           |
| Modality             | ASSERTIVE                                                                                                                                           |
| Confidence           | MEDIUM                                                                                                                                              |
| Scope                | COMMERCIAL_CHAIN                                                                                                                                    |
| Domain               | COMMERCIAL                                                                                                                                          |
| Actor                | TBD                                                                                                                                                 |
| Related terms        | cadeia comercial                                                                                                                                    |
| Candidate rule       | BR-002                                                                                                                                              |
| Pending decision     | DDP-009                                                                                                                                             |
| Conflict             | NONE                                                                                                                                                |
| Notes                |                                                                                                                                                     |

## EV-056

| Campo                | Valor                                                                           |
| -------------------- | ------------------------------------------------------------------------------- |
| Evidence ID          | EV-056                                                                          |
| Source ID            | SRC-001                                                                         |
| Source locator       | §12                                                                             |
| Evidence statement   | Relação e cardinalidade entre conceitos comerciais ainda não estão confirmadas. |
| Evidence type        | OPEN_QUESTION                                                                   |
| Temporal orientation | UNKNOWN                                                                         |
| Semantic status      | DECISION_REQUIRED                                                               |
| Modality             | ASSERTIVE                                                                       |
| Confidence           | MEDIUM                                                                          |
| Scope                | COMMERCIAL_CHAIN                                                                |
| Domain               | SYSTEM                                                                          |
| Actor                | TBD                                                                             |
| Related terms        | cardinalidade                                                                   |
| Candidate rule       | BR-013                                                                          |
| Pending decision     | DDP-009                                                                         |
| Conflict             | NONE                                                                            |
| Notes                |                                                                                 |

## EV-057

| Campo                | Valor                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Evidence ID          | EV-057                                                                |
| Source ID            | SRC-001                                                               |
| Source locator       | §12                                                                   |
| Evidence statement   | É proibido presumir que toda proposta gera PO ou que todo PO gera OS. |
| Evidence type        | PROHIBITION                                                           |
| Temporal orientation | TIMELESS                                                              |
| Semantic status      | EXPLICIT_CONSTRAINT                                                   |
| Modality             | DEONTIC                                                               |
| Confidence           | HIGH                                                                  |
| Scope                | COMMERCIAL_CHAIN                                                      |
| Domain               | SYSTEM                                                                |
| Actor                | TBD                                                                   |
| Related terms        | proposta; PO; OS                                                      |
| Candidate rule       | BR-013                                                                |
| Pending decision     | DDP-009                                                               |
| Conflict             | NONE                                                                  |
| Notes                |                                                                       |

## EV-058

| Campo                | Valor                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-058                                                                                                               |
| Source ID            | SRC-001                                                                                                              |
| Source locator       | §12                                                                                                                  |
| Evidence statement   | É proibido presumir cardinalidade fixa entre PO e OS, medição e nota, ou que toda nota é emitida pelo Sistema Cisne. |
| Evidence type        | PROHIBITION                                                                                                          |
| Temporal orientation | TIMELESS                                                                                                             |
| Semantic status      | EXPLICIT_CONSTRAINT                                                                                                  |
| Modality             | DEONTIC                                                                                                              |
| Confidence           | HIGH                                                                                                                 |
| Scope                | COMMERCIAL_CHAIN                                                                                                     |
| Domain               | SYSTEM                                                                                                               |
| Actor                | TBD                                                                                                                  |
| Related terms        | PO; OS; nota                                                                                                         |
| Candidate rule       | BR-013                                                                                                               |
| Pending decision     | DDP-023                                                                                                              |
| Conflict             | NONE                                                                                                                 |
| Notes                |                                                                                                                      |

## EV-059

| Campo                | Valor                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Evidence ID          | EV-059                                                                |
| Source ID            | SRC-001                                                               |
| Source locator       | §13                                                                   |
| Evidence statement   | Foi mencionada existência de Purchase Orders relacionados a clientes. |
| Evidence type        | BUSINESS_FACT                                                         |
| Temporal orientation | CURRENT_STATE                                                         |
| Semantic status      | REPORTED_AS_IS                                                        |
| Modality             | ASSERTIVE                                                             |
| Confidence           | MEDIUM                                                                |
| Scope                | PURCHASE_ORDER                                                        |
| Domain               | COMMERCIAL                                                            |
| Actor                | TBD                                                                   |
| Related terms        | PO; cliente                                                           |
| Candidate rule       | TBD                                                                   |
| Pending decision     | DDP-009                                                               |
| Conflict             | NONE                                                                  |
| Notes                |                                                                       |

## EV-060

| Campo                | Valor                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-060                                                                                                                                                                                         |
| Source ID            | SRC-001                                                                                                                                                                                        |
| Source locator       | §13                                                                                                                                                                                            |
| Evidence statement   | Sistema poderá precisar preservar dados de PO: número, requisição, partes, datas, itens, códigos, quantidades, preços, condições, local, gestor, requisitos de faturamento e saldo autorizado. |
| Evidence type        | FUTURE_CAPABILITY                                                                                                                                                                              |
| Temporal orientation | DESIRED_FUTURE                                                                                                                                                                                 |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                                                                                                      |
| Modality             | ASSERTIVE                                                                                                                                                                                      |
| Confidence           | MEDIUM                                                                                                                                                                                         |
| Scope                | PURCHASE_ORDER                                                                                                                                                                                 |
| Domain               | SYSTEM                                                                                                                                                                                         |
| Actor                | TBD                                                                                                                                                                                            |
| Related terms        | saldo; itens PO                                                                                                                                                                                |
| Candidate rule       | TBD                                                                                                                                                                                            |
| Pending decision     | DDP-009                                                                                                                                                                                        |
| Conflict             | NONE                                                                                                                                                                                           |
| Notes                |                                                                                                                                                                                                |

## EV-061

| Campo                | Valor                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Evidence ID          | EV-061                                                                                    |
| Source ID            | SRC-001                                                                                   |
| Source locator       | §13                                                                                       |
| Evidence statement   | Regras de um PO específico não devem ser transformadas automaticamente em regras globais. |
| Evidence type        | PROHIBITION                                                                               |
| Temporal orientation | TIMELESS                                                                                  |
| Semantic status      | EXPLICIT_CONSTRAINT                                                                       |
| Modality             | DEONTIC                                                                                   |
| Confidence           | HIGH                                                                                      |
| Scope                | PURCHASE_ORDER                                                                            |
| Domain               | SYSTEM                                                                                    |
| Actor                | TBD                                                                                       |
| Related terms        | PO específico; regra global                                                               |
| Candidate rule       | BR-018                                                                                    |
| Pending decision     | DDP-009                                                                                   |
| Conflict             | NONE                                                                                      |
| Notes                |                                                                                           |

## EV-062

| Campo                | Valor                                            |
| -------------------- | ------------------------------------------------ |
| Evidence ID          | EV-062                                           |
| Source ID            | SRC-001                                          |
| Source locator       | §14                                              |
| Evidence statement   | Processo de medição ainda precisa ser levantado. |
| Evidence type        | OPEN_QUESTION                                    |
| Temporal orientation | UNKNOWN                                          |
| Semantic status      | DECISION_REQUIRED                                |
| Modality             | ASSERTIVE                                        |
| Confidence           | MEDIUM                                           |
| Scope                | MEASUREMENT                                      |
| Domain               | OPERATIONS                                       |
| Actor                | TBD                                              |
| Related terms        | medição                                          |
| Candidate rule       | TBD                                              |
| Pending decision     | DDP-010                                          |
| Conflict             | NONE                                             |
| Notes                |                                                  |

## EV-063

| Campo                | Valor                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-063                                                                                              |
| Source ID            | SRC-001                                                                                             |
| Source locator       | §14                                                                                                 |
| Evidence statement   | Medição, faturamento, nota e pagamento não devem ser tratados automaticamente como um único estado. |
| Evidence type        | PRELIMINARY_RULE                                                                                    |
| Temporal orientation | TIMELESS                                                                                            |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                           |
| Modality             | DEONTIC                                                                                             |
| Confidence           | MEDIUM                                                                                              |
| Scope                | BILLING                                                                                             |
| Domain               | SYSTEM                                                                                              |
| Actor                | TBD                                                                                                 |
| Related terms        | medição; faturamento; pagamento                                                                     |
| Candidate rule       | BR-014                                                                                              |
| Pending decision     | DDP-010                                                                                             |
| Conflict             | NONE                                                                                                |
| Notes                |                                                                                                     |

## EV-064

| Campo                | Valor                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Evidence ID          | EV-064                                                                   |
| Source ID            | SRC-001                                                                  |
| Source locator       | §15                                                                      |
| Evidence statement   | Interesse demonstrado em produzir ou controlar digitalmente nota/fatura. |
| Evidence type        | FUTURE_CAPABILITY                                                        |
| Temporal orientation | DESIRED_FUTURE                                                           |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                |
| Modality             | ASSERTIVE                                                                |
| Confidence           | MEDIUM                                                                   |
| Scope                | FISCAL                                                                   |
| Domain               | FINANCE                                                                  |
| Actor                | TBD                                                                      |
| Related terms        | nota; fatura                                                             |
| Candidate rule       | TBD                                                                      |
| Pending decision     | DDP-023                                                                  |
| Conflict             | NONE                                                                     |
| Notes                |                                                                          |

## EV-065

| Campo                | Valor                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-065                                                                                                                                              |
| Source ID            | SRC-001                                                                                                                                             |
| Source locator       | §15                                                                                                                                                 |
| Evidence statement   | Não confirmado se o Sistema Cisne emitirá documento fiscal oficial, registrará externo, integrará ERP/fiscal ou produzirá apenas recibo não fiscal. |
| Evidence type        | OPEN_QUESTION                                                                                                                                       |
| Temporal orientation | UNKNOWN                                                                                                                                             |
| Semantic status      | DECISION_REQUIRED                                                                                                                                   |
| Modality             | INTERROGATIVE                                                                                                                                       |
| Confidence           | LOW                                                                                                                                                 |
| Scope                | FISCAL                                                                                                                                              |
| Domain               | SYSTEM                                                                                                                                              |
| Actor                | TBD                                                                                                                                                 |
| Related terms        | emissão fiscal; ERP                                                                                                                                 |
| Candidate rule       | TBD                                                                                                                                                 |
| Pending decision     | DDP-023                                                                                                                                             |
| Conflict             | NONE                                                                                                                                                |
| Notes                |                                                                                                                                                     |

## EV-066

| Campo                | Valor                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-066                                                                                                        |
| Source ID            | SRC-001                                                                                                       |
| Source locator       | §15                                                                                                           |
| Evidence statement   | Nenhum requisito fiscal deve ser implementado sem validação fiscal, contábil, técnica e legislação aplicável. |
| Evidence type        | PROHIBITION                                                                                                   |
| Temporal orientation | TIMELESS                                                                                                      |
| Semantic status      | EXPLICIT_CONSTRAINT                                                                                           |
| Modality             | DEONTIC                                                                                                       |
| Confidence           | HIGH                                                                                                          |
| Scope                | FISCAL                                                                                                        |
| Domain               | COMPLIANCE                                                                                                    |
| Actor                | TBD                                                                                                           |
| Related terms        | requisito fiscal                                                                                              |
| Candidate rule       | BR-019                                                                                                        |
| Pending decision     | DDP-023                                                                                                       |
| Conflict             | NONE                                                                                                          |
| Notes                |                                                                                                               |

## EV-067

| Campo                | Valor                                                         |
| -------------------- | ------------------------------------------------------------- |
| Evidence ID          | EV-067                                                        |
| Source ID            | SRC-001                                                       |
| Source locator       | §16                                                           |
| Evidence statement   | Preocupação expressa com muitas pessoas alterando documentos. |
| Evidence type        | SECURITY_CONCERN                                              |
| Temporal orientation | CURRENT_STATE                                                 |
| Semantic status      | REPORTED_AS_IS                                                |
| Modality             | ASSERTIVE                                                     |
| Confidence           | MEDIUM                                                        |
| Scope                | DOCUMENT                                                      |
| Domain               | SECURITY                                                      |
| Actor                | TBD                                                           |
| Related terms        | alteração documental                                          |
| Candidate rule       | BR-015                                                        |
| Pending decision     | DDP-015                                                       |
| Conflict             | NONE                                                          |
| Notes                |                                                               |

## EV-068

| Campo                | Valor                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-068                                                                                              |
| Source ID            | SRC-001                                                                                             |
| Source locator       | §16                                                                                                 |
| Evidence statement   | Relato preliminar: apenas pessoas específicas da gestão deveriam controlar determinados documentos. |
| Evidence type        | PROCESS_FACT                                                                                        |
| Temporal orientation | CURRENT_STATE                                                                                       |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                           |
| Modality             | ASSERTIVE                                                                                           |
| Confidence           | LOW                                                                                                 |
| Scope                | DOCUMENT                                                                                            |
| Domain               | MANAGEMENT                                                                                          |
| Actor                | TBD                                                                                                 |
| Related terms        | gestão; controle documental                                                                         |
| Candidate rule       | TBD                                                                                                 |
| Pending decision     | DDP-033                                                                                             |
| Conflict             | NONE                                                                                                |
| Notes                | Nomes e permissões não formalizados.                                                                |

## EV-069

| Campo                | Valor                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-069                                                                                                            |
| Source ID            | SRC-001                                                                                                           |
| Source locator       | §16                                                                                                               |
| Evidence statement   | Devem permanecer distintos DOCUMENTO LÓGICO, VERSÃO DOCUMENTAL, ARQUIVO BINÁRIO, STATUS DOCUMENTAL e RESPONSÁVEL. |
| Evidence type        | PRELIMINARY_RULE                                                                                                  |
| Temporal orientation | DESIRED_FUTURE                                                                                                    |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                         |
| Modality             | DEONTIC                                                                                                           |
| Confidence           | MEDIUM                                                                                                            |
| Scope                | DOCUMENT                                                                                                          |
| Domain               | SYSTEM                                                                                                            |
| Actor                | TBD                                                                                                               |
| Related terms        | documento lógico; versão                                                                                          |
| Candidate rule       | BR-015                                                                                                            |
| Pending decision     | DDP-013                                                                                                           |
| Conflict             | NONE                                                                                                              |
| Notes                |                                                                                                                   |

## EV-070

| Campo                | Valor                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-070                                                                                                     |
| Source ID            | SRC-001                                                                                                    |
| Source locator       | §16                                                                                                        |
| Evidence statement   | Substituição de documento não deve apagar silenciosamente versão anterior quando histórico for necessário. |
| Evidence type        | PRELIMINARY_RULE                                                                                           |
| Temporal orientation | DESIRED_FUTURE                                                                                             |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                  |
| Modality             | DEONTIC                                                                                                    |
| Confidence           | MEDIUM                                                                                                     |
| Scope                | DOCUMENT                                                                                                   |
| Domain               | SYSTEM                                                                                                     |
| Actor                | TBD                                                                                                        |
| Related terms        | versão; histórico                                                                                          |
| Candidate rule       | BR-016                                                                                                     |
| Pending decision     | DDP-013                                                                                                    |
| Conflict             | NONE                                                                                                       |
| Notes                |                                                                                                            |

## EV-071

| Campo                | Valor                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-071                                                                                                |
| Source ID            | SRC-001                                                                                               |
| Source locator       | §17                                                                                                   |
| Evidence statement   | Preocupação em saber quem recebeu, quando recebeu, visualizou, movimentou e quem é responsável atual. |
| Evidence type        | OPERATIONAL_NEED                                                                                      |
| Temporal orientation | DESIRED_FUTURE                                                                                        |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                             |
| Modality             | ASSERTIVE                                                                                             |
| Confidence           | MEDIUM                                                                                                |
| Scope                | RESPONSIBILITY                                                                                        |
| Domain               | OPERATIONS                                                                                            |
| Actor                | TBD                                                                                                   |
| Related terms        | handoff; responsável                                                                                  |
| Candidate rule       | TBD                                                                                                   |
| Pending decision     | DDP-032                                                                                               |
| Conflict             | NONE                                                                                                  |
| Notes                |                                                                                                       |

## EV-072

| Campo                | Valor                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-072                                                                                                                        |
| Source ID            | SRC-001                                                                                                                       |
| Source locator       | §17                                                                                                                           |
| Evidence statement   | Termos ASSIGNED, DELIVERED, AVAILABLE, VIEWED, ACKNOWLEDGED, ACCEPTED, PROCESSED, RETURNED ainda não são estados confirmados. |
| Evidence type        | OPEN_QUESTION                                                                                                                 |
| Temporal orientation | UNKNOWN                                                                                                                       |
| Semantic status      | DECISION_REQUIRED                                                                                                             |
| Modality             | ASSERTIVE                                                                                                                     |
| Confidence           | MEDIUM                                                                                                                        |
| Scope                | RESPONSIBILITY                                                                                                                |
| Domain               | SYSTEM                                                                                                                        |
| Actor                | TBD                                                                                                                           |
| Related terms        | ASSIGNED; VIEWED                                                                                                              |
| Candidate rule       | BR-021                                                                                                                        |
| Pending decision     | DDP-032                                                                                                                       |
| Conflict             | NONE                                                                                                                          |
| Notes                |                                                                                                                               |

## EV-073

| Campo                | Valor                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-073                                                                                                  |
| Source ID            | SRC-001                                                                                                 |
| Source locator       | §17                                                                                                     |
| Evidence statement   | Classificação futura desses termos pode ser evento, timestamp, auditoria, métrica ou estado de domínio. |
| Evidence type        | ENGINEERING_GUIDANCE                                                                                    |
| Temporal orientation | DESIRED_FUTURE                                                                                          |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                               |
| Modality             | ASSERTIVE                                                                                               |
| Confidence           | MEDIUM                                                                                                  |
| Scope                | RESPONSIBILITY                                                                                          |
| Domain               | SYSTEM                                                                                                  |
| Actor                | TBD                                                                                                     |
| Related terms        | evento; estado                                                                                          |
| Candidate rule       | BR-021                                                                                                  |
| Pending decision     | DDP-032                                                                                                 |
| Conflict             | NONE                                                                                                    |
| Notes                |                                                                                                         |

## EV-074

| Campo                | Valor                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-074                                                                                                                                         |
| Source ID            | SRC-001                                                                                                                                        |
| Source locator       | §18                                                                                                                                            |
| Evidence statement   | Sistema poderá precisar identificar solicitação parada, OS parada, medição sem processamento, nota sem envio/confirmação e pagamento atrasado. |
| Evidence type        | FUTURE_CAPABILITY                                                                                                                              |
| Temporal orientation | DESIRED_FUTURE                                                                                                                                 |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                                                      |
| Modality             | ASSERTIVE                                                                                                                                      |
| Confidence           | MEDIUM                                                                                                                                         |
| Scope                | AGING                                                                                                                                          |
| Domain               | OPERATIONS                                                                                                                                     |
| Actor                | TBD                                                                                                                                            |
| Related terms        | gargalo; pendência                                                                                                                             |
| Candidate rule       | TBD                                                                                                                                            |
| Pending decision     | DDP-024                                                                                                                                        |
| Conflict             | NONE                                                                                                                                           |
| Notes                |                                                                                                                                                |

## EV-075

| Campo                | Valor                                    |
| -------------------- | ---------------------------------------- |
| Evidence ID          | EV-075                                   |
| Source ID            | SRC-001                                  |
| Source locator       | §18                                      |
| Evidence statement   | Não existem faixas de aging confirmadas. |
| Evidence type        | OPEN_QUESTION                            |
| Temporal orientation | UNKNOWN                                  |
| Semantic status      | DECISION_REQUIRED                        |
| Modality             | ASSERTIVE                                |
| Confidence           | MEDIUM                                   |
| Scope                | AGING                                    |
| Domain               | SYSTEM                                   |
| Actor                | TBD                                      |
| Related terms        | aging; faixas                            |
| Candidate rule       | BR-022                                   |
| Pending decision     | DDP-024                                  |
| Conflict             | NONE                                     |
| Notes                |                                          |

## EV-076

| Campo                | Valor                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| Evidence ID          | EV-076                                                                               |
| Source ID            | SRC-001                                                                              |
| Source locator       | §18                                                                                  |
| Evidence statement   | Proibição de criar arbitrariamente intervalos de aging como 0–7, 8–15 ou 16–30 dias. |
| Evidence type        | PROHIBITION                                                                          |
| Temporal orientation | TIMELESS                                                                             |
| Semantic status      | EXPLICIT_CONSTRAINT                                                                  |
| Modality             | DEONTIC                                                                              |
| Confidence           | HIGH                                                                                 |
| Scope                | AGING                                                                                |
| Domain               | SYSTEM                                                                               |
| Actor                | TBD                                                                                  |
| Related terms        | faixas aging                                                                         |
| Candidate rule       | BR-022                                                                               |
| Pending decision     | DDP-024                                                                              |
| Conflict             | NONE                                                                                 |
| Notes                |                                                                                      |

## EV-077

| Campo                | Valor                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-077                                                                                                            |
| Source ID            | SRC-001                                                                                                           |
| Source locator       | §19                                                                                                               |
| Evidence statement   | Integrações candidatas mencionadas: ERP, fiscal, rastreamento veicular, WhatsApp, e-mail, armazenamento e backup. |
| Evidence type        | INTEGRATION_CANDIDATE                                                                                             |
| Temporal orientation | DESIRED_FUTURE                                                                                                    |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                         |
| Modality             | ASSERTIVE                                                                                                         |
| Confidence           | MEDIUM                                                                                                            |
| Scope                | INTEGRATION                                                                                                       |
| Domain               | SYSTEM                                                                                                            |
| Actor                | TBD                                                                                                               |
| Related terms        | ERP; WhatsApp; rastreamento                                                                                       |
| Candidate rule       | TBD                                                                                                               |
| Pending decision     | DDP-014                                                                                                           |
| Conflict             | NONE                                                                                                              |
| Notes                |                                                                                                                   |

## EV-078

| Campo                | Valor                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-078                                                                                                   |
| Source ID            | SRC-001                                                                                                  |
| Source locator       | §20                                                                                                      |
| Evidence statement   | Projeto deverá investigar segregação de funções, acesso por necessidade e restrição de custos e margens. |
| Evidence type        | SECURITY_CONCERN                                                                                         |
| Temporal orientation | DESIRED_FUTURE                                                                                           |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                |
| Modality             | DEONTIC                                                                                                  |
| Confidence           | MEDIUM                                                                                                   |
| Scope                | SECURITY                                                                                                 |
| Domain               | SYSTEM                                                                                                   |
| Actor                | TBD                                                                                                      |
| Related terms        | segregação; custo; margem                                                                                |
| Candidate rule       | BR-023                                                                                                   |
| Pending decision     | DDP-015                                                                                                  |
| Conflict             | NONE                                                                                                     |
| Notes                |                                                                                                          |

## EV-079

| Campo                | Valor                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-079                                                                                                                             |
| Source ID            | SRC-001                                                                                                                            |
| Source locator       | §20                                                                                                                                |
| Evidence statement   | Preocupações citadas incluem audit trail, controle de concorrência, idempotência, integridade de integrações e backup restaurável. |
| Evidence type        | ENGINEERING_CONCERN                                                                                                                |
| Temporal orientation | DESIRED_FUTURE                                                                                                                     |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                                                                          |
| Modality             | ASSERTIVE                                                                                                                          |
| Confidence           | MEDIUM                                                                                                                             |
| Scope                | SECURITY                                                                                                                           |
| Domain               | ENGINEERING                                                                                                                        |
| Actor                | TBD                                                                                                                                |
| Related terms        | auditoria; idempotência                                                                                                            |
| Candidate rule       | BR-023                                                                                                                             |
| Pending decision     | DDP-016                                                                                                                            |
| Conflict             | NONE                                                                                                                               |
| Notes                |                                                                                                                                    |

## EV-080

| Campo                | Valor                                                            |
| -------------------- | ---------------------------------------------------------------- |
| Evidence ID          | EV-080                                                           |
| Source ID            | SRC-001                                                          |
| Source locator       | §21                                                              |
| Evidence statement   | Vertical de locação aparece como prioridade econômica candidata. |
| Evidence type        | SCOPE_CANDIDATE                                                  |
| Temporal orientation | DESIRED_FUTURE                                                   |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                        |
| Modality             | ASSERTIVE                                                        |
| Confidence           | MEDIUM                                                           |
| Scope                | SCOPE                                                            |
| Domain               | DIRECTION                                                        |
| Actor                | TBD                                                              |
| Related terms        | locação; prioridade                                              |
| Candidate rule       | BR-020                                                           |
| Pending decision     | DDP-026                                                          |
| Conflict             | NONE                                                             |
| Notes                | Não confirma escopo de release.                                  |

## EV-081

| Campo                | Valor                                                                           |
| -------------------- | ------------------------------------------------------------------------------- |
| Evidence ID          | EV-081                                                                          |
| Source ID            | SRC-001                                                                         |
| Source locator       | §21                                                                             |
| Evidence statement   | Núcleo deverá ser estudado para não impedir expansão futura a outras operações. |
| Evidence type        | ENGINEERING_GUIDANCE                                                            |
| Temporal orientation | DESIRED_FUTURE                                                                  |
| Semantic status      | PRELIMINARY_UNDERSTANDING                                                       |
| Modality             | DEONTIC                                                                         |
| Confidence           | MEDIUM                                                                          |
| Scope                | ARCHITECTURE                                                                    |
| Domain               | SYSTEM                                                                          |
| Actor                | TBD                                                                             |
| Related terms        | expansão; núcleo                                                                |
| Candidate rule       | TBD                                                                             |
| Pending decision     | DDP-026                                                                         |
| Conflict             | NONE                                                                            |
| Notes                |                                                                                 |

## EV-082

| Campo                | Valor                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-082                                                                                                                              |
| Source ID            | SRC-001                                                                                                                             |
| Source locator       | §21                                                                                                                                 |
| Evidence statement   | Prioridade candidata de locação não autoriza implementar todas as verticais nem aumentar o primeiro release sem decisão da direção. |
| Evidence type        | SCOPE_CONSTRAINT                                                                                                                    |
| Temporal orientation | TIMELESS                                                                                                                            |
| Semantic status      | EXPLICIT_NON_COMMITMENT                                                                                                             |
| Modality             | DEONTIC                                                                                                                             |
| Confidence           | HIGH                                                                                                                                |
| Scope                | SCOPE                                                                                                                               |
| Domain               | DIRECTION                                                                                                                           |
| Actor                | TBD                                                                                                                                 |
| Related terms        | locação; release                                                                                                                    |
| Candidate rule       | BR-020                                                                                                                              |
| Pending decision     | DDP-026                                                                                                                             |
| Conflict             | NONE                                                                                                                                |
| Notes                |                                                                                                                                     |

## EV-083

| Campo                | Valor                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence ID          | EV-083                                                                                                                                                                                                                       |
| Source ID            | SRC-001                                                                                                                                                                                                                      |
| Source locator       | §22                                                                                                                                                                                                                          |
| Evidence statement   | Permanecem abertas pelo menos 27 decisões bloqueantes listadas na fonte (tipos de OS, fluxos, liberação, PO, medição, fiscal, SoT, integrações, PWA, offline, retenção, RPO, RTO, escopo do primeiro release, entre outras). |
| Evidence type        | BLOCKING_LIST                                                                                                                                                                                                                |
| Temporal orientation | UNKNOWN                                                                                                                                                                                                                      |
| Semantic status      | DECISION_REQUIRED                                                                                                                                                                                                            |
| Modality             | ASSERTIVE                                                                                                                                                                                                                    |
| Confidence           | MEDIUM                                                                                                                                                                                                                       |
| Scope                | DISCOVERY                                                                                                                                                                                                                    |
| Domain               | DIRECTION                                                                                                                                                                                                                    |
| Actor                | TBD                                                                                                                                                                                                                          |
| Related terms        | decisões bloqueantes                                                                                                                                                                                                         |
| Candidate rule       | TBD                                                                                                                                                                                                                          |
| Pending decision     | DDP-026                                                                                                                                                                                                                      |
| Conflict             | NONE                                                                                                                                                                                                                         |
| Notes                | Ver lista completa em SRC-001 §22.                                                                                                                                                                                           |

## EV-084

| Campo                | Valor                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Evidence ID          | EV-084                                                                                                                                     |
| Source ID            | SRC-001                                                                                                                                    |
| Source locator       | §1–2                                                                                                                                       |
| Evidence statement   | SRC-001 tem confiabilidade Média, situação PENDING_BUSINESS_VALIDATION, não confirma regras isoladamente e não substitui fontes primárias. |
| Evidence type        | SOURCE_META                                                                                                                                |
| Temporal orientation | TIMELESS                                                                                                                                   |
| Semantic status      | EXPLICIT_CAVEAT                                                                                                                            |
| Modality             | DEONTIC                                                                                                                                    |
| Confidence           | HIGH                                                                                                                                       |
| Scope                | GOVERNANCE                                                                                                                                 |
| Domain               | SYSTEM                                                                                                                                     |
| Actor                | TBD                                                                                                                                        |
| Related terms        | validação; fonte primária                                                                                                                  |
| Candidate rule       | TBD                                                                                                                                        |
| Pending decision     | TBD                                                                                                                                        |
| Conflict             | NONE                                                                                                                                       |
| Notes                |                                                                                                                                            |
