# REQ-ACT-001

| Campo | Valor |
| --- | --- |
| Document ID | Matriz ator × objetivo |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Prompt | 02 |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
## Atores candidatos

| ID | Ator | Descrição |
| --- | --- | --- |
| ACT-001 | Solicitante | Registra ou acompanha solicitação de serviço. |
| ACT-002 | Autorizador empresarial | Decide aprovação, liberação ou rejeição quando aplicável. |
| ACT-003 | Operacional / planejador | Prepara OS, itens e recursos planejados. |
| ACT-004 | Executor de serviço | Inicia e registra execução em campo ou operação. |
| ACT-005 | Motorista | Executor candidato em serviços com veículo. |
| ACT-006 | Operador de equipamento | Executor candidato em serviços com equipamento. |
| ACT-007 | Responsável pela OS | Recebe atribuição e pode confirmar recebimento. |
| ACT-008 | Analista de medição | Prepara e submete medição candidata. |
| ACT-009 | Financeiro | Registra faturamento, nota e saldo de PO candidatos. |
| ACT-010 | Responsável documental | Gerencia documentos lógicos e versões. |
| ACT-011 | Direção | Consulta relatórios e decisões estratégicas candidatas. |
| ACT-012 | Cliente externo | Contraparte comercial; poderes não confirmados. |
| ACT-013 | Administrador técnico | Operação do sistema; sem poder empresarial automático. |
| ACT-014 | Sistema externo | ERP, fiscal, rastreamento ou mensageria candidatos. |

## Objetivos por ator

| Ator | Objetivo | Suporte | FRs | Evidências |
| --- | --- | --- | --- | --- |
| Solicitante | Registrar solicitação de serviço | SUPPORTED | FR-001, FR-003 | EV-027, EV-029 |
| Solicitante | Acompanhar status da solicitação | SUPPORTED | FR-005 | EV-030 |
| Autorizador empresarial | Aprovar ou rejeitar solicitação | PARTIALLY_SUPPORTED | FR-006, FR-007 | EV-030, EV-033 |
| Autorizador empresarial | Liberar Ordem de Serviço | SUPPORTED | FR-014 | EV-036, EV-039 |
| Autorizador empresarial | Cancelar ou reabrir OS | PARTIALLY_SUPPORTED | FR-020, FR-021 | EV-047 |
| Operacional / planejador | Criar e preparar OS | SUPPORTED | FR-010, FR-011, FR-012 | EV-040, EV-042 |
| Operacional / planejador | Planejar recursos | SUPPORTED | FR-013, FR-023, FR-024 | EV-049, EV-054 |
| Executor de serviço | Executar OS liberada | SUPPORTED | FR-017, FR-018 | EV-044, EV-045 |
| Executor de serviço | Registrar evidências de execução | SUPPORTED | FR-040 | EV-046 |
| Motorista | Ser alocado como recurso | PARTIALLY_SUPPORTED | FR-025 | EV-051 |
| Operador de equipamento | Substituir equipamento em execução | PARTIALLY_SUPPORTED | FR-026 | EV-053 |
| Responsável pela OS | Receber atribuição de OS | SUPPORTED | FR-015, FR-016 | EV-071, EV-073 |
| Analista de medição | Preparar medição | PARTIALLY_SUPPORTED | FR-035, FR-036 | EV-062 |
| Analista de medição | Decidir sobre medição | PARTIALLY_SUPPORTED | FR-037 | EV-062, EV-063 |
| Financeiro | Registrar nota ou faturamento informado | PARTIALLY_SUPPORTED | FR-039 | EV-064, EV-066 |
| Financeiro | Consultar custo e margem | PARTIALLY_SUPPORTED | FR-032 | EV-061, EV-078 |
| Financeiro | Controlar saldo de PO | PARTIALLY_SUPPORTED | FR-033 | EV-059, EV-060 |
| Responsável documental | Gerenciar documentos e versões | SUPPORTED | FR-041, FR-042 | EV-067, EV-070 |
| Direção | Consultar relatórios operacionais | UNKNOWN | FR-005 | EV-074 |
| Cliente externo | Originar solicitação externa | PARTIALLY_SUPPORTED | FR-002 | EV-031, EV-032 |
| Administrador técnico | Administrar acesso técnico | UNKNOWN | — | EV-078 |
| Sistema externo | Fornecer dados comerciais ou fiscais | PARTIALLY_SUPPORTED | FR-030 | EV-077 |

> Nenhum ator recebe poderes definitivos. Administrador técnico não recebe poder empresarial automático.
