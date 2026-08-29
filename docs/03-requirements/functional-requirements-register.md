# REQ-FR-001

| Campo | Valor |
| --- | --- |
| Document ID | Registro de requisitos funcionais |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Prompt | 02 |
| Total FRs | 42 |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
## FR-001 — Registrar solicitação de serviço

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-001 |
| Título | Registrar solicitação de serviço |
| Declaração normativa | O sistema deverá permitir registrar uma solicitação de serviço com identificador interno único. |
| Tipo | Função principal |
| Domínio | Solicitação de serviço |
| Fonte | SRC-001 |
| Evidências | EV-005, EV-006, EV-027 |
| Regras relacionadas | BR-004, BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-001 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar uma solicitação de serviço com identificador interno único. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-001 |
| Autorização | AUTH-REQ-001 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-001, AC-002 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-002 — Identificar origem e canal da solicitação

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-002 |
| Título | Identificar origem e canal da solicitação |
| Declaração normativa | O sistema deverá permitir registrar a origem e o canal de entrada de uma solicitação quando informados. |
| Tipo | Dado |
| Domínio | Solicitação de serviço |
| Fonte | SRC-001 |
| Evidências | EV-027, EV-031, EV-032 |
| Regras relacionadas | BR-005 |
| Ator principal | UNKNOWN |
| Ator autorizador | NOT_APPLICABLE |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar a origem e o canal de entrada de uma solicitação quando informados. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | NOT_APPLICABLE |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | CAPABILITY_ONLY |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-021, DDP-033 |
| Critérios de aceite | AC-003 |
| Status | PENDING_BUSINESS_DECISION |

## FR-003 — Registrar solicitante da solicitação

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-003 |
| Título | Registrar solicitante da solicitação |
| Declaração normativa | O sistema deverá permitir associar um solicitante candidato a uma solicitação registrada. |
| Tipo | Dado |
| Domínio | Solicitação de serviço |
| Fonte | SRC-001 |
| Evidências | EV-029, EV-030 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | NOT_APPLICABLE |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir associar um solicitante candidato a uma solicitação registrada. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | NOT_APPLICABLE |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | UNKNOWN |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-004 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-004 — Anexar evidências à solicitação

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-004 |
| Título | Anexar evidências à solicitação |
| Declaração normativa | O sistema deverá permitir associar evidências documentais a uma solicitação quando a política empresarial exigir. |
| Tipo | Documento |
| Domínio | Solicitação de serviço |
| Fonte | SRC-001 |
| Evidências | EV-030 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-018 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir associar evidências documentais a uma solicitação quando a política empresarial exigir. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-008 |
| Autorização | AUTH-REQ-018 |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | LOW |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-005 |
| Status | PENDING_BUSINESS_DECISION |

## FR-005 — Acompanhar processamento da solicitação

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-005 |
| Título | Acompanhar processamento da solicitação |
| Declaração normativa | O sistema deverá permitir consultar o estado de processamento de uma solicitação registrada. |
| Tipo | Função principal |
| Domínio | Solicitação de serviço |
| Fonte | SRC-001 |
| Evidências | EV-005, EV-030 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-001 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir consultar o estado de processamento de uma solicitação registrada. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-001 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-006 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-006 — Registrar decisão sobre solicitação

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-006 |
| Título | Registrar decisão sobre solicitação |
| Declaração normativa | O sistema deverá permitir registrar decisão de aprovação ou rejeição de solicitação por ator autorizado quando aplicável. |
| Tipo | Autorização |
| Domínio | Solicitação de serviço |
| Fonte | SRC-001 |
| Evidências | EV-030, EV-033 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-002 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar decisão de aprovação ou rejeição de solicitação por ator autorizado quando aplicável. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-002 |
| Autorização | AUTH-REQ-002 |
| Histórico | UNKNOWN |
| Audit trail | CANDIDATE |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-007, AC-008 |
| Status | PENDING_BUSINESS_DECISION |

## FR-007 — Registrar motivo de rejeição de solicitação

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-007 |
| Título | Registrar motivo de rejeição de solicitação |
| Declaração normativa | O sistema deverá permitir registrar motivo quando uma solicitação for rejeitada, se a regra empresarial exigir motivo. |
| Tipo | Validação |
| Domínio | Solicitação de serviço |
| Fonte | SRC-001 |
| Evidências | EV-030 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-002 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar motivo quando uma solicitação for rejeitada, se a regra empresarial exigir motivo. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-002 |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-009 |
| Status | PENDING_BUSINESS_DECISION |

## FR-008 — Impedir conversão duplicada de solicitação

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-008 |
| Título | Impedir conversão duplicada de solicitação |
| Declaração normativa | O sistema deverá impedir que a mesma solicitação elegível seja convertida mais de uma vez em Ordem de Serviço oficial. |
| Tipo | Validação |
| Domínio | Solicitação de serviço |
| Fonte | SRC-001 |
| Evidências | EV-028, EV-034 |
| Regras relacionadas | BR-001, BR-004 |
| Ator principal | UNKNOWN |
| Ator autorizador | NOT_APPLICABLE |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá impedir que a mesma solicitação elegível seja convertida mais de uma vez em Ordem de Serviço oficial. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-002 |
| Autorização | NOT_APPLICABLE |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | REQUIRED |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-010 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-009 — Converter solicitação em OS mediante decisão autorizada

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-009 |
| Título | Converter solicitação em OS mediante decisão autorizada |
| Declaração normativa | O sistema deverá permitir converter solicitação elegível em Ordem de Serviço somente mediante decisão de ator autorizado. |
| Tipo | Função principal |
| Domínio | Solicitação de serviço |
| Fonte | SRC-001 |
| Evidências | EV-028, EV-036, EV-039 |
| Regras relacionadas | BR-001, BR-006 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-003 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir converter solicitação elegível em Ordem de Serviço somente mediante decisão de ator autorizado. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-003, EX-004 |
| Autorização | AUTH-REQ-003 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | CRITICAL |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-003 |
| Critérios de aceite | AC-011, AC-012 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-010 — Criar rascunho de Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-010 |
| Título | Criar rascunho de Ordem de Serviço |
| Declaração normativa | O sistema deverá permitir criar rascunho de Ordem de Serviço sem liberar execução. |
| Tipo | Função principal |
| Domínio | Ordem de Serviço |
| Fonte | SRC-001 |
| Evidências | EV-036, EV-039, EV-041 |
| Regras relacionadas | BR-006, BR-025 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-004 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir criar rascunho de Ordem de Serviço sem liberar execução. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-004 |
| Autorização | AUTH-REQ-004 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-003, DDP-022 |
| Critérios de aceite | AC-013 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-011 — Preparar conteúdo operacional da OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-011 |
| Título | Preparar conteúdo operacional da OS |
| Declaração normativa | O sistema deverá permitir registrar e editar conteúdo operacional candidato de uma Ordem de Serviço em preparação. |
| Tipo | Função principal |
| Domínio | Ordem de Serviço |
| Fonte | SRC-001 |
| Evidências | EV-040, EV-041, EV-042, EV-043 |
| Regras relacionadas | BR-007 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-005 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar e editar conteúdo operacional candidato de uma Ordem de Serviço em preparação. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-005 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | SERVICE_TYPE |
| Decisões pendentes | DDP-004, DDP-022 |
| Critérios de aceite | AC-014, AC-015 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-012 — Registrar itens planejados na OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-012 |
| Título | Registrar itens planejados na OS |
| Declaração normativa | O sistema deverá permitir registrar itens planejados associados a uma Ordem de Serviço. |
| Tipo | Função principal |
| Domínio | Ordem de Serviço |
| Fonte | SRC-001 |
| Evidências | EV-042, EV-058 |
| Regras relacionadas | BR-008 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-005 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar itens planejados associados a uma Ordem de Serviço. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-005 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | SERVICE_TYPE |
| Decisões pendentes | DDP-004 |
| Critérios de aceite | AC-016 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-013 — Planejar recursos necessários na OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-013 |
| Título | Planejar recursos necessários na OS |
| Declaração normativa | O sistema deverá permitir planejar tipos e quantidades de recursos necessários para uma Ordem de Serviço. |
| Tipo | Função principal |
| Domínio | Planejamento de recursos |
| Fonte | SRC-001 |
| Evidências | EV-049, EV-050, EV-054, EV-055 |
| Regras relacionadas | BR-011, BR-012 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-005 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir planejar tipos e quantidades de recursos necessários para uma Ordem de Serviço. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-005 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | SERVICE_TYPE |
| Decisões pendentes | DDP-006, DDP-007 |
| Critérios de aceite | AC-017 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-014 — Liberar OS somente por ator autorizado

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-014 |
| Título | Liberar OS somente por ator autorizado |
| Declaração normativa | O sistema deverá permitir liberar Ordem de Serviço elegível somente mediante ação de ator empresarial autorizado. |
| Tipo | Autorização |
| Domínio | Ordem de Serviço |
| Fonte | SRC-001 |
| Evidências | EV-013, EV-036, EV-038, EV-039 |
| Regras relacionadas | BR-006 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-006 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir liberar Ordem de Serviço elegível somente mediante ação de ator empresarial autorizado. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-003, EX-004 |
| Autorização | AUTH-REQ-006 |
| Histórico | UNKNOWN |
| Audit trail | CANDIDATE |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | CRITICAL |
| Obrigatoriedade | REQUIRED |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-003, DDP-015 |
| Critérios de aceite | AC-018, AC-019 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-015 — Atribuir responsável à OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-015 |
| Título | Atribuir responsável à OS |
| Declaração normativa | O sistema deverá permitir atribuir responsável candidato a uma Ordem de Serviço. |
| Tipo | Função principal |
| Domínio | Responsabilidade |
| Fonte | SRC-001 |
| Evidências | EV-071, EV-072, EV-073 |
| Regras relacionadas | BR-019 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-007 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir atribuir responsável candidato a uma Ordem de Serviço. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-007 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-015 |
| Critérios de aceite | AC-020 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-016 — Registrar visualização ou confirmação de recebimento

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-016 |
| Título | Registrar visualização ou confirmação de recebimento |
| Declaração normativa | O sistema deverá permitir registrar quando um responsável visualizou ou confirmou recebimento, se a regra empresarial exigir. |
| Tipo | Auditabilidade |
| Domínio | Responsabilidade |
| Fonte | SRC-001 |
| Evidências | EV-016, EV-073 |
| Regras relacionadas | BR-019 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-007 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar quando um responsável visualizou ou confirmou recebimento, se a regra empresarial exigir. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-007 |
| Histórico | REQUIRED |
| Audit trail | CANDIDATE |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-015 |
| Critérios de aceite | AC-021 |
| Status | PENDING_BUSINESS_DECISION |

## FR-017 — Iniciar execução autorizada da OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-017 |
| Título | Iniciar execução autorizada da OS |
| Declaração normativa | O sistema deverá permitir registrar início de execução de Ordem de Serviço liberada. |
| Tipo | Função principal |
| Domínio | Execução |
| Fonte | SRC-001 |
| Evidências | EV-044, EV-045 |
| Regras relacionadas | BR-006 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-008 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar início de execução de Ordem de Serviço liberada. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-003 |
| Autorização | AUTH-REQ-008 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-003 |
| Critérios de aceite | AC-022 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-018 — Registrar execução de serviço

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-018 |
| Título | Registrar execução de serviço |
| Declaração normativa | O sistema deverá permitir registrar progresso e realização de serviço em Ordem de Serviço em execução. |
| Tipo | Função principal |
| Domínio | Execução |
| Fonte | SRC-001 |
| Evidências | EV-044, EV-045, EV-046 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-008 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar progresso e realização de serviço em Ordem de Serviço em execução. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-008 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-023 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-019 — Concluir Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-019 |
| Título | Concluir Ordem de Serviço |
| Declaração normativa | O sistema deverá permitir registrar conclusão de Ordem de Serviço elegível. |
| Tipo | Função principal |
| Domínio | Ordem de Serviço |
| Fonte | SRC-001 |
| Evidências | EV-045, EV-046 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-009 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar conclusão de Ordem de Serviço elegível. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-003 |
| Autorização | AUTH-REQ-009 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-005 |
| Critérios de aceite | AC-024 |
| Status | PENDING_BUSINESS_DECISION |

## FR-020 — Cancelar Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-020 |
| Título | Cancelar Ordem de Serviço |
| Declaração normativa | O sistema deverá permitir cancelar Ordem de Serviço elegível mediante ator autorizado. |
| Tipo | Função principal |
| Domínio | Ordem de Serviço |
| Fonte | SRC-001 |
| Evidências | EV-047 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-010 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir cancelar Ordem de Serviço elegível mediante ator autorizado. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-003 |
| Autorização | AUTH-REQ-010 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-005 |
| Critérios de aceite | AC-025 |
| Status | PENDING_BUSINESS_DECISION |

## FR-021 — Reabrir Ordem de Serviço quando sustentado

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-021 |
| Título | Reabrir Ordem de Serviço quando sustentado |
| Declaração normativa | O sistema deverá permitir reabrir Ordem de Serviço concluída somente se regra empresarial futura autorizar. |
| Tipo | Função principal |
| Domínio | Ordem de Serviço |
| Fonte | SRC-001 |
| Evidências | EV-047 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-011 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir reabrir Ordem de Serviço concluída somente se regra empresarial futura autorizar. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-003 |
| Autorização | AUTH-REQ-011 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | LOW |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-005 |
| Critérios de aceite | AC-026 |
| Status | PENDING_BUSINESS_DECISION |

## FR-022 — Preservar histórico de alterações da OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-022 |
| Título | Preservar histórico de alterações da OS |
| Declaração normativa | O sistema deverá preservar histórico empresarial de alterações relevantes em Ordem de Serviço. |
| Tipo | Auditabilidade |
| Domínio | Auditoria |
| Fonte | SRC-001 |
| Evidências | EV-078, EV-079 |
| Regras relacionadas | BR-023 |
| Ator principal | UNKNOWN |
| Ator autorizador | NOT_APPLICABLE |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá preservar histórico empresarial de alterações relevantes em Ordem de Serviço. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-009 |
| Autorização | NOT_APPLICABLE |
| Histórico | REQUIRED |
| Audit trail | CANDIDATE |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | REQUIRED |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-015 |
| Critérios de aceite | AC-027 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-023 — Planejar mão de obra na OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-023 |
| Título | Planejar mão de obra na OS |
| Declaração normativa | O sistema deverá permitir planejar tipo e quantidade de mão de obra necessária sem exigir pessoa executora definida. |
| Tipo | Função principal |
| Domínio | Mão de obra |
| Fonte | SRC-001 |
| Evidências | EV-054, EV-055, EV-056, EV-057 |
| Regras relacionadas | BR-012 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-005 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir planejar tipo e quantidade de mão de obra necessária sem exigir pessoa executora definida. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-005 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | SERVICE_TYPE |
| Decisões pendentes | DDP-006 |
| Critérios de aceite | AC-028 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-024 — Planejar equipamentos e veículos na OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-024 |
| Título | Planejar equipamentos e veículos na OS |
| Declaração normativa | O sistema deverá permitir planejar tipos e quantidades de equipamentos e veículos necessários. |
| Tipo | Função principal |
| Domínio | Equipamentos |
| Fonte | SRC-001 |
| Evidências | EV-049, EV-050, EV-051, EV-052 |
| Regras relacionadas | BR-011 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-005 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir planejar tipos e quantidades de equipamentos e veículos necessários. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-005 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | SERVICE_TYPE |
| Decisões pendentes | DDP-007, DDP-027 |
| Critérios de aceite | AC-029 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-025 — Alocar recurso específico a item de OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-025 |
| Título | Alocar recurso específico a item de OS |
| Declaração normativa | O sistema deverá permitir alocar ativo ou pessoa específica a item planejado de Ordem de Serviço. |
| Tipo | Função principal |
| Domínio | Alocação de recursos |
| Fonte | SRC-001 |
| Evidências | EV-051, EV-053 |
| Regras relacionadas | BR-011, BR-017 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-007 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir alocar ativo ou pessoa específica a item planejado de Ordem de Serviço. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-006 |
| Autorização | AUTH-REQ-007 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | SERVICE_TYPE |
| Decisões pendentes | DDP-007 |
| Critérios de aceite | AC-030 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-026 — Registrar substituição de recurso

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-026 |
| Título | Registrar substituição de recurso |
| Declaração normativa | O sistema deverá permitir registrar substituição de recurso alocado durante execução. |
| Tipo | Função principal |
| Domínio | Alocação de recursos |
| Fonte | SRC-001 |
| Evidências | EV-053, EV-057 |
| Regras relacionadas | BR-012 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-008 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar substituição de recurso alocado durante execução. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-008 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-006 |
| Critérios de aceite | AC-031 |
| Status | PENDING_BUSINESS_DECISION |

## FR-027 — Registrar quantidade efetivamente utilizada

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-027 |
| Título | Registrar quantidade efetivamente utilizada |
| Declaração normativa | O sistema deverá permitir registrar quantidade efetivamente utilizada distinta da quantidade planejada e alocada. |
| Tipo | Dado |
| Domínio | Quantidades |
| Fonte | SRC-001 |
| Evidências | EV-051, EV-064, EV-065 |
| Regras relacionadas | BR-010 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-008 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar quantidade efetivamente utilizada distinta da quantidade planejada e alocada. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-008 |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | SERVICE_TYPE |
| Decisões pendentes | DDP-008 |
| Critérios de aceite | AC-032 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-028 — Indicar possível conflito de alocação

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-028 |
| Título | Indicar possível conflito de alocação |
| Declaração normativa | O sistema deverá sinalizar possível conflito quando o mesmo recurso candidato estiver alocado simultaneamente. |
| Tipo | Validação |
| Domínio | Alocação de recursos |
| Fonte | SRC-001 |
| Evidências | EV-053 |
| Regras relacionadas | BR-017 |
| Ator principal | UNKNOWN |
| Ator autorizador | NOT_APPLICABLE |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá sinalizar possível conflito quando o mesmo recurso candidato estiver alocado simultaneamente. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-006 |
| Autorização | NOT_APPLICABLE |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-007 |
| Critérios de aceite | AC-033 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-029 — Registrar referência comercial na OS

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-029 |
| Título | Registrar referência comercial na OS |
| Declaração normativa | O sistema deverá permitir associar referências comerciais candidatas (proposta, pedido, contrato ou PO) a Ordem de Serviço. |
| Tipo | Dado |
| Domínio | Comercial |
| Fonte | SRC-001 |
| Evidências | EV-055, EV-056, EV-059 |
| Regras relacionadas | BR-002, BR-008 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-005 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir associar referências comerciais candidatas (proposta, pedido, contrato ou PO) a Ordem de Serviço. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-005 |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | CONTRACT |
| Decisões pendentes | DDP-009, DDP-030 |
| Critérios de aceite | AC-034 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-030 — Preservar identificadores externos comerciais

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-030 |
| Título | Preservar identificadores externos comerciais |
| Declaração normativa | O sistema deverá preservar identificadores externos comerciais informados sem alterá-los silenciosamente. |
| Tipo | Dado |
| Domínio | Comercial |
| Fonte | SRC-001 |
| Evidências | EV-059, EV-060, EV-072 |
| Regras relacionadas | BR-008 |
| Ator principal | UNKNOWN |
| Ator autorizador | NOT_APPLICABLE |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá preservar identificadores externos comerciais informados sem alterá-los silenciosamente. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | NOT_APPLICABLE |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | PURCHASE_ORDER |
| Decisões pendentes | DDP-009 |
| Critérios de aceite | AC-035 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-031 — Separar custo interno e preço comercial

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-031 |
| Título | Separar custo interno e preço comercial |
| Declaração normativa | O sistema deverá manter distinção conceitual entre custo interno e preço comercial em itens elegíveis. |
| Tipo | Dado |
| Domínio | Preço e custo |
| Fonte | SRC-001 |
| Evidências | EV-058, EV-059, EV-060, EV-061 |
| Regras relacionadas | BR-013, BR-018 |
| Ator principal | UNKNOWN |
| Ator autorizador | NOT_APPLICABLE |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá manter distinção conceitual entre custo interno e preço comercial em itens elegíveis. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | NOT_APPLICABLE |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | CRITICAL |
| Obrigatoriedade | REQUIRED |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-009 |
| Critérios de aceite | AC-036 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-032 — Restringir visualização de custo e margem

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-032 |
| Título | Restringir visualização de custo e margem |
| Declaração normativa | O sistema deverá restringir visualização de custo e margem a atores empresariais autorizados quando custo for registrado. |
| Tipo | Autorização |
| Domínio | Preço e custo |
| Fonte | SRC-001 |
| Evidências | EV-061, EV-078 |
| Regras relacionadas | BR-018, BR-023 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-012 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá restringir visualização de custo e margem a atores empresariais autorizados quando custo for registrado. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-004 |
| Autorização | AUTH-REQ-012 |
| Histórico | UNKNOWN |
| Audit trail | CANDIDATE |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-009 |
| Critérios de aceite | AC-037, AC-038 |
| Status | PENDING_BUSINESS_DECISION |

## FR-033 — Registrar saldo ou consumo de PO

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-033 |
| Título | Registrar saldo ou consumo de PO |
| Declaração normativa | O sistema deverá permitir registrar saldo autorizado e consumo candidato de Purchase Order quando PO estiver vinculado. |
| Tipo | Função principal |
| Domínio | Purchase Order |
| Fonte | SRC-001 |
| Evidências | EV-059, EV-060, EV-072 |
| Regras relacionadas | BR-008 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-005 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar saldo autorizado e consumo candidato de Purchase Order quando PO estiver vinculado. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-010 |
| Autorização | AUTH-REQ-005 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | CONDITIONAL |
| Escopo | PURCHASE_ORDER |
| Decisões pendentes | DDP-009, DDP-030 |
| Critérios de aceite | AC-039 |
| Status | PENDING_BUSINESS_DECISION |

## FR-034 — Identificar divergência comercial

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-034 |
| Título | Identificar divergência comercial |
| Declaração normativa | O sistema deverá permitir identificar e registrar divergência entre pedido, execução e cobrança candidata. |
| Tipo | Validação |
| Domínio | Comercial |
| Fonte | SRC-001 |
| Evidências | EV-023, EV-056, EV-063 |
| Regras relacionadas | BR-002, BR-009 |
| Ator principal | UNKNOWN |
| Ator autorizador | NOT_APPLICABLE |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir identificar e registrar divergência entre pedido, execução e cobrança candidata. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-011 |
| Autorização | NOT_APPLICABLE |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-010 |
| Critérios de aceite | AC-040 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-035 — Preparar medição de itens executados

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-035 |
| Título | Preparar medição de itens executados |
| Declaração normativa | O sistema deverá permitir preparar medição de itens executados elegíveis com origem identificável. |
| Tipo | Função principal |
| Domínio | Medição |
| Fonte | SRC-001 |
| Evidências | EV-062, EV-063 |
| Regras relacionadas | BR-009 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-013 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir preparar medição de itens executados elegíveis com origem identificável. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-011 |
| Autorização | AUTH-REQ-013 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-011 |
| Critérios de aceite | AC-041 |
| Status | PENDING_BUSINESS_DECISION |

## FR-036 — Submeter medição para decisão

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-036 |
| Título | Submeter medição para decisão |
| Declaração normativa | O sistema deverá permitir submeter medição preparada para decisão de ator autorizado quando aplicável. |
| Tipo | Função principal |
| Domínio | Medição |
| Fonte | SRC-001 |
| Evidências | EV-062 |
| Regras relacionadas | BR-009 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-014 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir submeter medição preparada para decisão de ator autorizado quando aplicável. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | NOT_APPLICABLE |
| Autorização | AUTH-REQ-014 |
| Histórico | REQUIRED |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | MEDIUM |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-011 |
| Critérios de aceite | AC-042 |
| Status | PENDING_BUSINESS_DECISION |

## FR-037 — Registrar decisão sobre medição

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-037 |
| Título | Registrar decisão sobre medição |
| Declaração normativa | O sistema deverá permitir registrar aprovação ou rejeição de medição por ator autorizado quando regra existir. |
| Tipo | Autorização |
| Domínio | Medição |
| Fonte | SRC-001 |
| Evidências | EV-062, EV-063 |
| Regras relacionadas | BR-009 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-014 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar aprovação ou rejeição de medição por ator autorizado quando regra existir. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-011 |
| Autorização | AUTH-REQ-014 |
| Histórico | UNKNOWN |
| Audit trail | CANDIDATE |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-011 |
| Critérios de aceite | AC-043 |
| Status | PENDING_BUSINESS_DECISION |

## FR-038 — Identificar origem de item faturável

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-038 |
| Título | Identificar origem de item faturável |
| Declaração normativa | O sistema deverá exigir origem identificável para itens candidatos a cobrança quando regra preliminar se aplicar. |
| Tipo | Validação |
| Domínio | Faturamento |
| Fonte | SRC-001 |
| Evidências | EV-017, EV-058, EV-062 |
| Regras relacionadas | BR-014 |
| Ator principal | UNKNOWN |
| Ator autorizador | NOT_APPLICABLE |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá exigir origem identificável para itens candidatos a cobrança quando regra preliminar se aplicar. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-007 |
| Autorização | NOT_APPLICABLE |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | CRITICAL |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-010 |
| Critérios de aceite | AC-044 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-039 — Registrar documento de faturamento ou nota

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-039 |
| Título | Registrar documento de faturamento ou nota |
| Declaração normativa | O sistema deverá permitir registrar documento de faturamento ou nota informada sem presumir emissão fiscal pelo sistema. |
| Tipo | Documento |
| Domínio | Faturamento |
| Fonte | SRC-001 |
| Evidências | EV-064, EV-065, EV-066 |
| Regras relacionadas | BR-010, BR-015 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-015 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar documento de faturamento ou nota informada sem presumir emissão fiscal pelo sistema. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-012 |
| Autorização | AUTH-REQ-015 |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Sim |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | UNKNOWN |
| Decisões pendentes | DDP-023 |
| Critérios de aceite | AC-045 |
| Status | PENDING_BUSINESS_DECISION |

## FR-040 — Registrar evidências de execução

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-040 |
| Título | Registrar evidências de execução |
| Declaração normativa | O sistema deverá permitir registrar evidências de execução vinculadas a itens de Ordem de Serviço. |
| Tipo | Documento |
| Domínio | Evidências |
| Fonte | SRC-001 |
| Evidências | EV-046, EV-067 |
| Regras relacionadas | BR-024 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-008 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar evidências de execução vinculadas a itens de Ordem de Serviço. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-008 |
| Autorização | AUTH-REQ-008 |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Desconhecido |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-046 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-041 — Registrar documento lógico e versões

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-041 |
| Título | Registrar documento lógico e versões |
| Declaração normativa | O sistema deverá permitir registrar documento lógico com versões documentais e arquivo associado. |
| Tipo | Documento |
| Domínio | Documentos |
| Fonte | SRC-001 |
| Evidências | EV-067, EV-068, EV-069, EV-070 |
| Regras relacionadas | BR-016 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-016 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá permitir registrar documento lógico com versões documentais e arquivo associado. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-009 |
| Autorização | AUTH-REQ-016 |
| Histórico | UNKNOWN |
| Audit trail | UNKNOWN |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | CONDITIONAL |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-012 |
| Critérios de aceite | AC-047, AC-048 |
| Status | PENDING_SOURCE_VALIDATION |

## FR-042 — Controlar substituição e acesso a documentos

| Campo | Valor |
| --- | --- |
| Requirement ID | FR-042 |
| Título | Controlar substituição e acesso a documentos |
| Declaração normativa | O sistema deverá controlar substituição de documentos e acesso conforme necessidade empresarial, preservando versões anteriores quando necessário. |
| Tipo | Autorização |
| Domínio | Documentos |
| Fonte | SRC-001 |
| Evidências | EV-021, EV-022, EV-069, EV-070 |
| Regras relacionadas | BR-016, BR-020 |
| Ator principal | UNKNOWN |
| Ator autorizador | AUTH-REQ-017 |
| Trigger | TBD_BY_DDP |
| Pré-condições | INSUFFICIENT_EVIDENCE — ver DDP |
| Entradas | TBD |
| Processamento empresarial | O sistema deverá controlar substituição de documentos e acesso conforme necessidade empresarial, preservando versões anteriores quando necessário. |
| Saída | Registro ou efeito observável candidato |
| Pós-condições | UNKNOWN |
| Exceções | EX-009 |
| Autorização | AUTH-REQ-017 |
| Histórico | UNKNOWN |
| Audit trail | CANDIDATE |
| Efeito financeiro | Não |
| Consistência | UNKNOWN |
| Concorrência | UNKNOWN |
| Retry sensitivity | UNKNOWN |
| Criticidade | HIGH |
| Obrigatoriedade | REQUIRED |
| Escopo | GLOBAL |
| Decisões pendentes | DDP-012, DDP-013 |
| Critérios de aceite | AC-049, AC-050 |
| Status | PENDING_SOURCE_VALIDATION |
