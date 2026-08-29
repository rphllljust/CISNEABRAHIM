# REQ-DR-001

| Campo             | Valor                          |
| ----------------- | ------------------------------ |
| Document ID       | Requisitos de dados            |
| Fonte             | SRC-001                        |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em         | 2026-08-28                     |
| Prompt            | 02                             |
| Total DRs         | 28                             |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
>
> | ID     | Conceito                                    | Finalidade                                         | FR     | Sensibilidade | Obrigatoriedade | SoT                          | Status                    |
> | ------ | ------------------------------------------- | -------------------------------------------------- | ------ | ------------- | --------------- | ---------------------------- | ------------------------- |
> | DR-001 | Identificador interno da solicitação        | Rastrear solicitação unicamente                    | FR-001 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-002 | Origem e canal da solicitação               | Rastrear proveniência                              | FR-002 | INTERNAL      | CAPABILITY_ONLY | UNKNOWN                      | PENDING_BUSINESS_DECISION |
> | DR-003 | Solicitante candidato                       | Identificar quem solicitou                         | FR-003 | INTERNAL      | UNKNOWN         | UNKNOWN                      | PENDING_SOURCE_VALIDATION |
> | DR-004 | Estado de processamento da solicitação      | Acompanhamento                                     | FR-005 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-005 | Identificador interno da OS                 | Rastrear OS unicamente                             | FR-010 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-006 | Conteúdo operacional da OS                  | Descrever serviço a executar                       | FR-011 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-007 | Itens planejados da OS                      | Detalhar escopo planejado                          | FR-012 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-008 | Recursos planejados (tipo e quantidade)     | Planejamento operacional                           | FR-013 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-009 | Responsável atribuído à OS                  | Accountability operacional                         | FR-015 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-010 | Registro de execução e progresso            | Acompanhar realização                              | FR-018 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-011 | Alocação de recurso específico              | Vincular ativo ou pessoa ao item                   | FR-025 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-012 | Quantidade efetivamente utilizada           | Distinguir planejado de realizado                  | FR-027 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-013 | Referência comercial externa                | Vínculo com proposta, pedido, contrato ou PO       | FR-029 | COMMERCIAL    | CONDITIONAL     | UNKNOWN — pode ser externo   | PENDING_SOURCE_VALIDATION |
> | DR-014 | Identificador externo comercial             | Preservar ID do cliente ou ERP                     | FR-030 | COMMERCIAL    | CONDITIONAL     | Externo candidato            | PENDING_SOURCE_VALIDATION |
> | DR-015 | Custo interno                               | Gestão de margem                                   | FR-031 | RESTRICTED    | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-016 | Preço comercial                             | Cobrança e proposta                                | FR-031 | COMMERCIAL    | CONDITIONAL     | Sistema ou externo candidato | PENDING_SOURCE_VALIDATION |
> | DR-017 | Saldo e consumo de PO                       | Controle de limite comercial                       | FR-033 | COMMERCIAL    | CONDITIONAL     | UNKNOWN                      | PENDING_BUSINESS_DECISION |
> | DR-018 | Medição preparada                           | Base para faturamento candidato                    | FR-035 | COMMERCIAL    | CONDITIONAL     | Sistema candidato            | PENDING_BUSINESS_DECISION |
> | DR-019 | Documento de faturamento ou nota informada  | Registrar cobrança sem emissão fiscal pelo sistema | FR-039 | COMMERCIAL    | CONDITIONAL     | Externo candidato            | PENDING_BUSINESS_DECISION |
> | DR-020 | Evidência de execução                       | Comprovar realização                               | FR-040 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-021 | Documento lógico                            | Entidade documental de negócio                     | FR-041 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-022 | Versão documental e arquivo associado       | Preservar histórico documental                     | FR-041 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-023 | Histórico de alterações da OS               | Auditoria empresarial                              | FR-022 | INTERNAL      | REQUIRED        | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-024 | Decisão sobre solicitação                   | Registro de aprovação ou rejeição                  | FR-006 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_BUSINESS_DECISION |
> | DR-025 | Motivo de rejeição                          | Justificativa empresarial                          | FR-007 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_BUSINESS_DECISION |
> | DR-026 | Divergência comercial registrada            | Tratamento de inconsistências                      | FR-034 | COMMERCIAL    | CONDITIONAL     | Sistema candidato            | PENDING_SOURCE_VALIDATION |
> | DR-027 | Substituição de recurso alocado             | Rastrear mudanças em campo                         | FR-026 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_BUSINESS_DECISION |
> | DR-028 | Confirmação de recebimento pelo responsável | Handoff operacional                                | FR-016 | INTERNAL      | CONDITIONAL     | Sistema candidato            | PENDING_BUSINESS_DECISION |

## Detalhamento

### DR-001 — Identificador interno da solicitação

- **Fonte:** SRC-001
- **Evidências:** EV-005
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-002
- **Status:** PENDING_SOURCE_VALIDATION

### DR-002 — Origem e canal da solicitação

- **Fonte:** SRC-001
- **Evidências:** EV-031
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-021
- **Status:** PENDING_BUSINESS_DECISION

### DR-003 — Solicitante candidato

- **Fonte:** SRC-001
- **Evidências:** EV-029
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-002
- **Status:** PENDING_SOURCE_VALIDATION

### DR-004 — Estado de processamento da solicitação

- **Fonte:** SRC-001
- **Evidências:** EV-030
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-002
- **Status:** PENDING_SOURCE_VALIDATION

### DR-005 — Identificador interno da OS

- **Fonte:** SRC-001
- **Evidências:** EV-036
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-003
- **Status:** PENDING_SOURCE_VALIDATION

### DR-006 — Conteúdo operacional da OS

- **Fonte:** SRC-001
- **Evidências:** EV-040, EV-042
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-004
- **Status:** PENDING_SOURCE_VALIDATION

### DR-007 — Itens planejados da OS

- **Fonte:** SRC-001
- **Evidências:** EV-042
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-004
- **Status:** PENDING_SOURCE_VALIDATION

### DR-008 — Recursos planejados (tipo e quantidade)

- **Fonte:** SRC-001
- **Evidências:** EV-049
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-006, DDP-007
- **Status:** PENDING_SOURCE_VALIDATION

### DR-009 — Responsável atribuído à OS

- **Fonte:** SRC-001
- **Evidências:** EV-071
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-015
- **Status:** PENDING_SOURCE_VALIDATION

### DR-010 — Registro de execução e progresso

- **Fonte:** SRC-001
- **Evidências:** EV-045, EV-046
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-003
- **Status:** PENDING_SOURCE_VALIDATION

### DR-011 — Alocação de recurso específico

- **Fonte:** SRC-001
- **Evidências:** EV-051
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-007
- **Status:** PENDING_SOURCE_VALIDATION

### DR-012 — Quantidade efetivamente utilizada

- **Fonte:** SRC-001
- **Evidências:** EV-051, EV-064
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-008
- **Status:** PENDING_SOURCE_VALIDATION

### DR-013 — Referência comercial externa

- **Fonte:** SRC-001
- **Evidências:** EV-055, EV-059
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-009, DDP-030
- **Status:** PENDING_SOURCE_VALIDATION

### DR-014 — Identificador externo comercial

- **Fonte:** SRC-001
- **Evidências:** EV-059, EV-072
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-009
- **Status:** PENDING_SOURCE_VALIDATION

### DR-015 — Custo interno

- **Fonte:** SRC-001
- **Evidências:** EV-058, EV-061
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-009
- **Status:** PENDING_SOURCE_VALIDATION

### DR-016 — Preço comercial

- **Fonte:** SRC-001
- **Evidências:** EV-058
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-009
- **Status:** PENDING_SOURCE_VALIDATION

### DR-017 — Saldo e consumo de PO

- **Fonte:** SRC-001
- **Evidências:** EV-060
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-009
- **Status:** PENDING_BUSINESS_DECISION

### DR-018 — Medição preparada

- **Fonte:** SRC-001
- **Evidências:** EV-062
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-011
- **Status:** PENDING_BUSINESS_DECISION

### DR-019 — Documento de faturamento ou nota informada

- **Fonte:** SRC-001
- **Evidências:** EV-064, EV-066
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-023
- **Status:** PENDING_BUSINESS_DECISION

### DR-020 — Evidência de execução

- **Fonte:** SRC-001
- **Evidências:** EV-046, EV-067
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-002
- **Status:** PENDING_SOURCE_VALIDATION

### DR-021 — Documento lógico

- **Fonte:** SRC-001
- **Evidências:** EV-067
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-012
- **Status:** PENDING_SOURCE_VALIDATION

### DR-022 — Versão documental e arquivo associado

- **Fonte:** SRC-001
- **Evidências:** EV-068, EV-069
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-012
- **Status:** PENDING_SOURCE_VALIDATION

### DR-023 — Histórico de alterações da OS

- **Fonte:** SRC-001
- **Evidências:** EV-078, EV-079
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-015
- **Status:** PENDING_SOURCE_VALIDATION

### DR-024 — Decisão sobre solicitação

- **Fonte:** SRC-001
- **Evidências:** EV-030
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-002
- **Status:** PENDING_BUSINESS_DECISION

### DR-025 — Motivo de rejeição

- **Fonte:** SRC-001
- **Evidências:** EV-030
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-002
- **Status:** PENDING_BUSINESS_DECISION

### DR-026 — Divergência comercial registrada

- **Fonte:** SRC-001
- **Evidências:** EV-023
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-010
- **Status:** PENDING_SOURCE_VALIDATION

### DR-027 — Substituição de recurso alocado

- **Fonte:** SRC-001
- **Evidências:** EV-053
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-006
- **Status:** PENDING_BUSINESS_DECISION

### DR-028 — Confirmação de recebimento pelo responsável

- **Fonte:** SRC-001
- **Evidências:** EV-073
- **Momento de captura:** UNKNOWN
- **Alteração:** UNKNOWN
- **Histórico:** CANDIDATE
- **DDP:** DDP-015
- **Status:** PENDING_BUSINESS_DECISION
