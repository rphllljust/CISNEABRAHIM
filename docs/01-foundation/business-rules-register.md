# Business rules register

| Campo                        | Valor                  |
| ---------------------------- | ---------------------- |
| Document ID                  | BR-REG-001             |
| Source of register structure | SRC-000                |
| Last updated                 | 2026-08-28 (Prompt 01) |
| Confirmed rules              | **0**                  |

## Status permitidos

```text
CANDIDATE
PENDING_VALIDATION
CONFIRMED
CONFLICT
REJECTED
DEPRECATED
SUPERSEDED
```

Nenhuma regra neste arquivo está `CONFIRMED`. SRC-001 analisado no Prompt 01; todas as entradas abaixo permanecem candidatas ou pendentes de validação.

Template: [`../templates/business-rule-template.md`](../templates/business-rule-template.md).

## BR-001

| Campo                   | Valor                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                      | BR-001                                                                                                                                                     |
| Title                   | Distinção entre solicitação e Ordem de Serviço                                                                                                             |
| Statement               | Hipótese de descoberta: solicitação e Ordem de Serviço são conceitos distintos; solicitação recebida não deve ser tratada automaticamente como OS oficial. |
| Status                  | `CANDIDATE`                                                                                                                                                |
| Source                  | SRC-000; **reforçado por** SRC-001 EV-028                                                                                                                  |
| Evidence                | EV-028                                                                                                                                                     |
| Actor                   | `TBD`                                                                                                                                                      |
| Rationale for inclusion | Evitar colapso de termos na modelagem                                                                                                                      |
| Blocks implementation?  | Sim                                                                                                                                                        |

## BR-002

| Campo                  | Valor                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                     | BR-002                                                                                                                                                |
| Title                  | Encadeamento documental e financeiro não é universal                                                                                                  |
| Statement              | Proposta, pedido, PO, OS, execução, medição, faturamento e pagamento podem relacionar-se, mas cardinalidades e obrigatoriedade não estão confirmadas. |
| Status                 | `CANDIDATE`                                                                                                                                           |
| Source                 | SRC-000; **reforçado por** SRC-001 EV-055, EV-056                                                                                                     |
| Evidence               | EV-055, EV-056                                                                                                                                        |
| Actor                  | `TBD`                                                                                                                                                 |
| Blocks implementation? | Sim                                                                                                                                                   |

## BR-003

| Campo                  | Valor                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| ID                     | BR-003                                                                                                  |
| Title                  | Multiplicidade de atividades não implica um único processo                                              |
| Statement              | Atividades citadas não estão confirmadas como um único fluxo, tipo de OS ou módulo do primeiro release. |
| Status                 | `CANDIDATE`                                                                                             |
| Source                 | SRC-000; **reforçado por** SRC-001 EV-002, EV-003                                                       |
| Evidence               | EV-002, EV-003                                                                                          |
| Actor                  | `TBD`                                                                                                   |
| Blocks implementation? | Sim                                                                                                     |

## BR-004

| Campo                  | Valor                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| ID                     | BR-004                                                                                                                                   |
| Title                  | Solicitação por WhatsApp não implica OS                                                                                                  |
| Statement              | Contato por WhatsApp pedindo serviço ou OS é relatado no processo atual; não autoriza tratar a mensagem como OS oficial automaticamente. |
| Status                 | `CANDIDATE`                                                                                                                              |
| Source                 | SRC-001                                                                                                                                  |
| Evidence               | EV-027, EV-028                                                                                                                           |
| Blocks implementation? | Sim (canal e registro)                                                                                                                   |

## BR-005

| Campo            | Valor                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ID               | BR-005                                                                                                                             |
| Title            | WhatsApp como canal — status oficial pendente                                                                                      |
| Statement        | WhatsApp foi citado como canal de contato; permanece pendente se será canal oficial e como o sistema se relacionará com conversas. |
| Status           | `PENDING_VALIDATION`                                                                                                               |
| Source           | SRC-001                                                                                                                            |
| Evidence         | EV-027, EV-031, EV-032                                                                                                             |
| Pending decision | DDP-021, DDP-033                                                                                                                   |

## BR-006

| Campo            | Valor                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| ID               | BR-006                                                                                                     |
| Title            | Liberação autorizada de OS                                                                                 |
| Statement        | Entendimento preliminar: OS oficial só após decisão autorizada; preocupação com OS aberta sem autorização. |
| Status           | `CANDIDATE`                                                                                                |
| Source           | SRC-001                                                                                                    |
| Evidence         | EV-013, EV-036, EV-038, EV-039                                                                             |
| Pending decision | DDP-003                                                                                                    |

## BR-007

| Campo            | Valor                                                          |
| ---------------- | -------------------------------------------------------------- |
| ID               | BR-007                                                         |
| Title            | Rascunho de OS distinto de liberação                           |
| Statement        | Criar rascunho não deve ser confundido com liberar a execução. |
| Status           | `CANDIDATE`                                                    |
| Source           | SRC-001                                                        |
| Evidence         | EV-042                                                         |
| Pending decision | DDP-022                                                        |

## BR-008

| Campo            | Valor                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| ID               | BR-008                                                                      |
| Title            | Separação custo interno e preço comercial                                   |
| Statement        | CUSTO INTERNO e PREÇO COMERCIAL devem permanecer conceitualmente separados. |
| Status           | `CANDIDATE`                                                                 |
| Source           | SRC-001                                                                     |
| Evidence         | EV-020, EV-058, EV-059                                                      |
| Pending decision | DDP-030                                                                     |

## BR-009

| Campo            | Valor                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ |
| ID               | BR-009                                                                                     |
| Title            | Origem identificável para cobrança                                                         |
| Statement        | Necessidade preliminar de que itens que possam gerar cobrança tenham origem identificável. |
| Status           | `CANDIDATE`                                                                                |
| Source           | SRC-001                                                                                    |
| Evidence         | EV-017, EV-023, EV-062, EV-063                                                             |
| Pending decision | DDP-011                                                                                    |

## BR-010

| Campo     | Valor                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------- |
| ID        | BR-010                                                                                                |
| Title     | Fases de quantidade distintas (ITEM_*)                                                                |
| Statement | Não criar propriedade genérica `quantity` para todas as fases; distinguir ITEM_PLANNED até ITEM_PAID. |
| Status    | `CANDIDATE`                                                                                           |
| Source    | SRC-001                                                                                               |
| Evidence  | EV-051, EV-064, EV-065                                                                                |
| Risk      | RISK-019                                                                                              |

## BR-011

| Campo            | Valor                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| ID               | BR-011                                                                                                                            |
| Title            | Distinção tipo de equipamento, físico e veículo                                                                                   |
| Statement        | Diferenciar tipo de equipamento, equipamento físico, veículo e categoria operacional; quantidades planejada, alocada e utilizada. |
| Status           | `CANDIDATE`                                                                                                                       |
| Source           | SRC-001                                                                                                                           |
| Evidence         | EV-019, EV-049, EV-050, EV-051                                                                                                    |
| Pending decision | DDP-007                                                                                                                           |

## BR-012

| Campo            | Valor                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| ID               | BR-012                                                                                      |
| Title            | Tipo de mão de obra vs pessoa executora                                                     |
| Statement        | Diferenciar TIPO DE MÃO DE OBRA de PESSOA EXECUTORA; evitar registro apenas em observações. |
| Status           | `CANDIDATE`                                                                                 |
| Source           | SRC-001                                                                                     |
| Evidence         | EV-018, EV-054, EV-055, EV-056                                                              |
| Pending decision | DDP-006                                                                                     |

## BR-013

| Campo            | Valor                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| ID               | BR-013                                                                                                              |
| Title            | Proibição de presumir cardinalidades comerciais                                                                     |
| Statement        | Proibido presumir que toda proposta gera PO, todo PO gera OS, ou cardinalidades fixas entre PO, OS, medição e nota. |
| Status           | `CANDIDATE`                                                                                                         |
| Source           | SRC-001                                                                                                             |
| Evidence         | EV-057, EV-058                                                                                                      |
| Pending decision | DDP-009                                                                                                             |

## BR-014

| Campo            | Valor                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| ID               | BR-014                                                                  |
| Title            | Medição, faturamento, nota e pagamento são distintos                    |
| Statement        | Não tratar medição, faturamento, nota e pagamento como um único estado. |
| Status           | `CANDIDATE`                                                             |
| Source           | SRC-001                                                                 |
| Evidence         | EV-074                                                                  |
| Pending decision | DDP-010, DDP-011, DDP-012                                               |

## BR-015

| Campo            | Valor                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| ID               | BR-015                                                                                                  |
| Title            | Separação documento lógico, versão, arquivo e status                                                    |
| Statement        | Manter distintos documento lógico, versão documental, arquivo binário, status documental e responsável. |
| Status           | `CANDIDATE`                                                                                             |
| Source           | SRC-001                                                                                                 |
| Evidence         | EV-021, EV-079, EV-081                                                                                  |
| Pending decision | DDP-013                                                                                                 |

## BR-016

| Campo            | Valor                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| ID               | BR-016                                                                                        |
| Title            | Preservação de versões documentais                                                            |
| Statement        | Substituição não deve apagar silenciosamente versão anterior quando histórico for necessário. |
| Status           | `CANDIDATE`                                                                                   |
| Source           | SRC-001                                                                                       |
| Evidence         | EV-022, EV-082                                                                                |
| Pending decision | DDP-013                                                                                       |

## BR-017

| Campo            | Valor                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| ID               | BR-017                                                                             |
| Title            | Cadastro patrimonial completo condicionado                                         |
| Statement        | Não criar cadastro patrimonial completo de equipamentos sem validação empresarial. |
| Status           | `CANDIDATE`                                                                        |
| Source           | SRC-001                                                                            |
| Evidence         | EV-053                                                                             |
| Pending decision | DDP-007                                                                            |

## BR-018

| Campo            | Valor                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| ID               | BR-018                                                                                    |
| Title            | Regra de PO específico não vira regra global                                              |
| Statement        | Regras de um PO específico não devem ser transformadas automaticamente em regras globais. |
| Status           | `CANDIDATE`                                                                               |
| Source           | SRC-001                                                                                   |
| Evidence         | EV-072                                                                                    |
| Pending decision | DDP-009                                                                                   |

## BR-019

| Campo            | Valor                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| ID               | BR-019                                                                                               |
| Title            | Requisitos fiscais condicionados a validação                                                         |
| Statement        | Nenhum requisito fiscal implementado sem validação fiscal, contábil, técnica e legislação aplicável. |
| Status           | `CANDIDATE`                                                                                          |
| Source           | SRC-001                                                                                              |
| Evidence         | EV-078                                                                                               |
| Pending decision | DDP-023                                                                                              |
| Risk             | RISK-012                                                                                             |

## BR-020

| Campo            | Valor                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID               | BR-020                                                                                                                                                             |
| Title            | Locação como prioridade candidata, não escopo confirmado                                                                                                           |
| Statement        | Vertical de locação aparece como prioridade econômica candidata; não autoriza implementar todas as verticais nem expandir primeiro release sem decisão da direção. |
| Status           | `CANDIDATE`                                                                                                                                                        |
| Source           | SRC-001                                                                                                                                                            |
| Evidence         | EV-003, EV-080, EV-082                                                                                                                                             |
| Pending decision | DDP-026                                                                                                                                                            |
| Risk             | RISK-021                                                                                                                                                           |

## BR-021

| Campo            | Valor                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| ID               | BR-021                                                                                               |
| Title            | Estados de responsabilidade não confirmados                                                          |
| Statement        | Termos ASSIGNED, DELIVERED, VIEWED, etc. não são estados confirmados; classificação futura pendente. |
| Status           | `PENDING_VALIDATION`                                                                                 |
| Source           | SRC-001                                                                                              |
| Evidence         | EV-071, EV-072                                                                                       |
| Pending decision | DDP-032                                                                                              |

## BR-022

| Campo            | Valor                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| ID               | BR-022                                                                                         |
| Title            | Proibição de faixas de aging arbitrárias                                                       |
| Statement        | Não existem faixas de aging confirmadas; proibido inventar intervalos como 0–7 dias sem fonte. |
| Status           | `CANDIDATE`                                                                                    |
| Source           | SRC-001                                                                                        |
| Evidence         | EV-016, EV-075, EV-076                                                                         |
| Pending decision | DDP-024                                                                                        |

## BR-023

| Campo            | Valor                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| ID               | BR-023                                                                                                       |
| Title            | Segregação e segurança a investigar                                                                          |
| Statement        | Projeto deve investigar segregação de funções, acesso por necessidade, proteção de documentos e audit trail. |
| Status           | `CANDIDATE`                                                                                                  |
| Source           | SRC-001                                                                                                      |
| Evidence         | EV-078, EV-079                                                                                               |
| Pending decision | DDP-015                                                                                                      |

## BR-024

| Campo          | Valor                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ID             | BR-024                                                                                                                      |
| Title          | Problemas operacionais são candidatos de investigação                                                                       |
| Statement      | Problemas listados em SRC-001 §4 são candidatos; ocorrência e frequência precisam confirmação por entrevistas e documentos. |
| Status         | `CANDIDATE`                                                                                                                 |
| Source         | SRC-001                                                                                                                     |
| Evidence       | EV-012–EV-026                                                                                                               |
| Classification | Metarregra de descoberta                                                                                                    |

## BR-025

| Campo            | Valor                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| ID               | BR-025                                                                  |
| Title            | Solicitar não equivale a autorizar                                      |
| Statement        | Solicitar serviço ou OS não equivale a autorizar abertura ou liberação. |
| Status           | `CANDIDATE`                                                             |
| Source           | SRC-001                                                                 |
| Evidence         | EV-041                                                                  |
| Pending decision | DDP-003                                                                 |
| Risk             | RISK-022                                                                |

## Próximos IDs

Próximo livre: `BR-026`. Não reutilizar `BR-001`–`BR-025`.
