# AUTHZ-METHOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Método de modelagem de autorização empresarial |
| Prompt | 08 |

## Objetivo

Definir **quem pode fazer o quê, sobre qual recurso, em qual contexto** — antes de escolher autenticação, JWT, biblioteca IAM ou estrutura de persistência.

## Identificadores

| Tipo | Padrão |
| --- | --- |
| Ator | ACT-NNN |
| Papel empresarial candidato | ROLE-CAND-NNN |
| Regra de autorização | AUTHZ-NNN |
| Segregação de funções | SOD-NNN |
| Negação catalogada | DENY-NNN |
| Decisão pendente | ADP-NNN |

## Campos obrigatórios por AUTHZ

Ator · papel candidato · ação · recurso · contexto · escopo · condição · estado/transição · dados acessíveis · dados ocultos · fonte · evidências · BR/FR/UC/CMD/DDP · efeito financeiro · criticidade · auditabilidade · status.

## Status

`CANDIDATE` · `PENDING_SOURCE_VALIDATION` · `PENDING_BUSINESS_DECISION` · `ACCEPTED_FOR_ARCHITECTURAL_DESIGN` · `DENIED_BY_POLICY_CANDIDATE` · `CONFLICT`

## Tipos de autorização

| Tipo | Descrição | Onde |
| --- | --- | --- |
| Funcional | Papel pode executar classe de ação | command-authorization-matrix |
| Contextual | Depende de vínculo, estado, escopo | contextual-authorization-rules |
| Dados | Visibilidade de campos sensíveis | sensitive-data-access-matrix |
| Transição | Guarda empresarial de SM | transition-authorization-matrix |

## Escopos candidatos (não são claims)

`OWN_RECORD` · `ASSIGNED_RECORD` · `CLIENT_SCOPE` · `CONTRACT_SCOPE` · `UNIT_SCOPE` · `OPERATIONAL_SCOPE` · `FINANCIAL_SCOPE` · `DOCUMENT_SCOPE` · `GLOBAL_SCOPE` · `UNKNOWN`

## Proibições

- Roles técnicas definitivas (`admin`, `superuser` empresarial)
- Permissão CONFIRMED sem fonte primária
- RBAC como substituto de alçada empresarial (BND-CFL-010)
- UI como boundary de segurança (AGENTS.md §18)

## Relação com prompts anteriores

| Origem | Uso |
| --- | --- |
| CMD-001..022 | Ações autorizáveis |
| TR-CAND-001..048 | Transições sensíveis |
| SEC-REQ-001..010 | Requisitos de negócio |
| INV-006, INV-007 | Custo e financeiro |
| DDP-003, DDP-015, DDP-022 | Alçadas e SoD |

## Relação com implementação futura

Autenticação (SEC-REQ-017), MFA (SEC-REQ-018) e mecanismos técnicos pertencem a prompts posteriores — **não** modelados aqui.
