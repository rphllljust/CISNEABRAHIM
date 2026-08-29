# Source registry

| Campo        | Valor                                           |
| ------------ | ----------------------------------------------- |
| Document ID  | SRC-REG-001                                     |
| Last updated | 2026-08-29 (Prompt 29-A: aprovação formal SRC-002) |

## Como preencher

- Novo documento recebe o próximo `SRC-NNN` livre. Não reutilizar IDs.
- Não inventar `SOURCE-ID` para arquivo inexistente.
- Copiar estrutura de [`../templates/source-template.md`](../templates/source-template.md) na ingestão (Prompt 01+).
- SRC-000 **não** prova regra operacional.

## Fontes registradas

### SRC-000

| Campo                                 | Valor                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SOURCE-ID                             | SRC-000                                                                                                                                                            |
| Title                                 | Prompt 00 — Inicialização profissional do projeto CISNE RONDÔNIA                                                                                                   |
| Type                                  | GOVERNANÇA_DE_PROJETO                                                                                                                                              |
| Origin                                | Instrução de inicialização do repositório (responsável pelo projeto / sequência de prompts)                                                                        |
| Location                              | Este repositório (prompt de governança; não é Documento Mestre empresarial)                                                                                        |
| Date received                         | 2026-08-28                                                                                                                                                         |
| Status                                | REGISTERED                                                                                                                                                         |
| Classification                        | Fonte de governança do projeto                                                                                                                                     |
| May prove operational business rules? | **NO**                                                                                                                                                             |
| Notes                                 | Autoriza estrutura documental, protocolo, princípios de engenharia e restrições desta fase. O contexto empresarial citado no prompt é preliminar e não contratual. |

### SRC-001

| Campo                                                                               | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SOURCE-ID                                                                           | SRC-001                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Title                                                                               | Contexto inicial informado pelo patrocinador                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Type                                                                                | Declaração inicial consolidada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Origin                                                                              | Informações apresentadas pelo responsável pelo projeto durante o levantamento preliminar                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Location                                                                            | [`../inputs/SRC-001-contexto-inicial-patrocinador.md`](../inputs/SRC-001-contexto-inicial-patrocinador.md)                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Date received / consolidation                                                       | 2026-08-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Reliability                                                                         | Média                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Status                                                                              | `PENDING_BUSINESS_VALIDATION`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Classification                                                                      | `SPONSOR_CONTEXT_RECONSTRUCTED` · `PENDING_BUSINESS_VALIDATION`                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| May prove operational business rules in isolation?                                  | **NO**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Must be confronted with primary documents?                                          | **YES**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Substitutes primary sources?                                                        | **NO** — não substitui Documento Mestre, transcrições originais, proposta, contrato, PO, nota/fatura, documentação fiscal, contábil, ERP, nem confirmação formal da direção                                                                                                                                                                                                                                                                                                                                                            |
| Integrity                                                                           | Arquivo criado neste repositório no Prompt 00.1; consolidação reconstruída, não original primário                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Personal / sensitive data                                                           | Não identificado neste consolidado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Affected domains (candidatos de cobertura desta fonte; não são módulos confirmados) | Atividades empresariais citadas; solicitação de serviço; abertura e liberação de OS; conteúdo operacional da OS; equipamentos, veículos e máquinas; mão de obra; custo interno vs preço comercial; origem de cobrança e fases de item; cadeia comercial (proposta, pedido, PO, contrato, OS, execução, medição, faturamento, pagamento); documentos e versões; responsabilidade e handoff; gargalos e aging; integrações candidatas; preocupações de segurança; prioridade candidata (locação); decisões bloqueantes listadas na fonte |
| Atomic analysis                                                                     | **COMPLETE** (Prompt 01 — 84 evidências EV-001–EV-084 em [`../02-source-analysis/atomic-evidence-register.md`](../02-source-analysis/atomic-evidence-register.md))                                                                                                                                                                                                                                                                                                                                                                     |
| Analyzed in prompt                                                                  | **01** (2026-08-28)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Notes                                                                               | Fonte de contexto reconstruído. Nenhuma afirmação promovida a `CONFIRMED` no Prompt 01. Permanece `PENDING_BUSINESS_VALIDATION`. Complementado por SRC-002 (decisões Cliente).                                                                                                                                                                                                                                                                                                                                                                                                       |

### SRC-002

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-002 |
| Title | Confirmação de baseline empresarial — módulo Clientes e decisões correlatas |
| Type | `BUSINESS_DECISION` · `DOCUMENTARY_EVIDENCE` (parcial) |
| Origin | Questionário criado Prompt 28; decisões registradas Prompt 29-A corretivo (instrução empresarial autorizada) |
| Location | [`../inputs/SRC-002-business-baseline-confirmation.md`](../inputs/SRC-002-business-baseline-confirmation.md) |
| Date received | 2026-08-29 |
| Approval date | 2026-08-29 |
| Status | `APPROVED` |
| Classification | `BUSINESS_CONFIRMATION_APPROVED` |
| May prove operational business rules? | **YES** (escopo Cliente e DDP-028; aprovação formal registrada) |
| Signed by | Abrahim Jabour Junior |
| Signed role | Administrador |
| Business facts recorded | CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA; CNPJ 11.897.171/0001-81 (operadora, não Client); código externo 152888 (referência comercial, não PK) |
| Business decisions recorded | Q01–Q15; DDP-020 (CLIENT_SCOPE); DDP-028; DDP-041 |
| Technical decisions recorded | Autorização via Identity + Capability + Scope; sem hardcode de proprietários |
| Confirmed rules promoted | BR-025..BR-040 (`CONFIRMED`); BR-041 (`CONDITIONAL`) — ver `business-rules-register.md` |
| Conflicts resolved | MAP-001, MAP-002 |
| Analyzed in prompt | **29-A corretivo** (2026-08-29) |
| Approved in prompt | **29-A aprovação humana** (2026-08-29) |
| Notes | Gate `LIBERADO`; `mandatory_blockers_count: 0`. Histórico: AWAITING_RESPONSE → ANALYZED_BLOCKED → BLOCKED_BY_SIGNATURE_ONLY → APPROVED. |

## Fontes ainda não fornecidas

Status uniforme: `NOT_PROVIDED`. Nenhum `SOURCE-ID` foi atribuído a estes artefatos (atribuir somente quando o original existir). **SRC-001 não preenche e não substitui** esta lista.

| Artefato esperado            | Status         |
| ---------------------------- | -------------- |
| Documento Mestre             | `NOT_PROVIDED` |
| Regras de negócio            | `NOT_PROVIDED` |
| Transcrições                 | `NOT_PROVIDED` |
| Propostas                    | `NOT_PROVIDED` |
| Contratos                    | `NOT_PROVIDED` |
| Purchase Orders              | `NOT_PROVIDED` |
| Notas / faturas              | `NOT_PROVIDED` |
| Planilhas                    | `NOT_PROVIDED` |
| Formulários                  | `NOT_PROVIDED` |
| Documentos operacionais      | `NOT_PROVIDED` |
| Documentação de ERP          | `NOT_PROVIDED` |
| Documentação de rastreamento | `NOT_PROVIDED` |
| Requisitos fiscais           | `NOT_PROVIDED` |
| Requisitos jurídicos         | `NOT_PROVIDED` |
| Requisitos de infraestrutura | `NOT_PROVIDED` |

Área de depósito futuro: [`../inputs/README.md`](../inputs/README.md).
