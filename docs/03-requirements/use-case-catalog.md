# REQ-UC-001

| Campo | Valor |
| --- | --- |
| Document ID | Catálogo de casos de uso |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Prompt | 02 |
| Total UCs | 26 |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
## UC-001 — Registrar solicitação de serviço

| Campo | Valor |
| --- | --- |
| Objetivo | Registrar solicitação com identificador único e dados de origem quando informados. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Solicitante |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-005, EV-027, EV-029, EV-031 |
| Regras | BR-004, BR-005, BR-024 |
| Requisitos relacionados | FR-001, FR-002, FR-003 |
| Trigger | Necessidade de serviço identificada |
| Pré-condições | Ator candidato identificado ou UNKNOWN |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Solicitação registrada e consultável. |
| Decisões pendentes | DDP-002, DDP-021 |
| Critérios de aceite | AC-001, AC-002, AC-003, AC-004 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator inicia registro de solicitação.
2. O sistema solicita dados mínimos disponíveis.
3. O ator informa origem e canal quando conhecidos.
4. O sistema registra solicitação com identificador interno único.
5. O sistema associa solicitante candidato quando informado.

### Fluxos alternativos

- A1. Origem não informada — registro prossegue com campos UNKNOWN.

## UC-002 — Anexar evidências à solicitação

| Campo | Valor |
| --- | --- |
| Objetivo | Associar evidências documentais quando política empresarial exigir. |
| Escopo | GLOBAL |
| Nível | SUBFUNCTION |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Solicitante |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-030 |
| Regras | BR-024 |
| Requisitos relacionados | FR-004 |
| Trigger | Política exige evidência na solicitação |
| Pré-condições | Solicitação registrada |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Evidência associada ou pendência registrada. |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-005 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator seleciona solicitação elegível.
2. O ator informa evidência candidata.
3. STEP_PENDING_DECISION — política de tipos e obrigatoriedade.
4. O sistema associa evidência à solicitação.

### Fluxos alternativos

- A1. Política não exige evidência — passo 3 permanece pendente.

## UC-003 — Acompanhar processamento da solicitação

| Campo | Valor |
| --- | --- |
| Objetivo | Consultar estado de processamento da solicitação. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Solicitante |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-005, EV-030 |
| Regras | BR-024 |
| Requisitos relacionados | FR-005 |
| Trigger | Necessidade de acompanhamento |
| Pré-condições | Solicitação existente |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Estado exibido sem alterar solicitação. |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-006 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator informa identificador da solicitação.
2. O sistema apresenta estado de processamento candidato.
3. O sistema preserva histórico consultável.

## UC-004 — Decidir sobre solicitação

| Campo | Valor |
| --- | --- |
| Objetivo | Registrar aprovação ou rejeição por ator autorizado quando aplicável. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Autorizador empresarial |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-030, EV-033 |
| Regras | BR-024 |
| Requisitos relacionados | FR-006, FR-007 |
| Trigger | Solicitação aguardando decisão |
| Pré-condições | Solicitação elegível; Ator autorizado candidato |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Decisão registrada. |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-007, AC-008, AC-009 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O autorizador consulta solicitação.
2. STEP_PENDING_DECISION — critérios de elegibilidade para decisão.
3. O autorizador registra aprovação ou rejeição.
4. Se rejeitada, STEP_PENDING_DECISION — motivo obrigatório ou opcional.
5. O sistema registra decisão e preserva autoria.

### Fluxos alternativos

- A1. Ator sem autorização — ver EX-002.

## UC-005 — Converter solicitação em Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Objetivo | Converter solicitação elegível em OS mediante decisão autorizada. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Autorizador empresarial |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-028, EV-034, EV-036, EV-039 |
| Regras | BR-001, BR-006 |
| Requisitos relacionados | FR-008, FR-009 |
| Trigger | Solicitação aprovada ou elegível |
| Pré-condições | Solicitação não convertida anteriormente |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | OS criada a partir da solicitação. |
| Decisões pendentes | DDP-003 |
| Critérios de aceite | AC-010, AC-011, AC-012 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator solicita conversão.
2. O sistema verifica ausência de conversão prévia.
3. O sistema valida autorização do ator.
4. O sistema cria OS vinculada à solicitação.
5. O sistema marca solicitação como convertida.

### Fluxos alternativos

- A1. Conversão duplicada — sistema impede (EX-002).

## UC-006 — Criar e preparar Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Objetivo | Criar rascunho e registrar conteúdo operacional e itens planejados. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Operacional / planejador |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-036, EV-040, EV-041, EV-042 |
| Regras | BR-006, BR-007, BR-025 |
| Requisitos relacionados | FR-010, FR-011, FR-012 |
| Trigger | Necessidade de nova OS ou preparação |
| Pré-condições | Ator autorizado a criar rascunho |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Rascunho preparado com itens registrados. |
| Decisões pendentes | DDP-003, DDP-004, DDP-022 |
| Critérios de aceite | AC-013, AC-014, AC-015, AC-016 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator cria rascunho de OS.
2. O ator registra conteúdo operacional candidato.
3. O ator registra itens planejados.
4. O sistema mantém OS em preparação sem liberar execução.

## UC-007 — Planejar recursos da OS

| Campo | Valor |
| --- | --- |
| Objetivo | Planejar mão de obra, equipamentos e veículos necessários. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Operacional / planejador |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-049, EV-050, EV-054, EV-055 |
| Regras | BR-011, BR-012 |
| Requisitos relacionados | FR-013, FR-023, FR-024 |
| Trigger | OS em preparação |
| Pré-condições | OS em estado de preparação |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Planejamento de recursos registrado. |
| Decisões pendentes | DDP-006, DDP-007 |
| Critérios de aceite | AC-017, AC-028, AC-029 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator acessa OS em preparação.
2. O ator registra tipos e quantidades de mão de obra.
3. O ator registra equipamentos e veículos planejados.
4. O sistema distingue planejado de alocado.

## UC-008 — Liberar Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Objetivo | Liberar OS elegível somente por ator empresarial autorizado. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Autorizador empresarial |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-013, EV-036, EV-038, EV-039 |
| Regras | BR-006 |
| Requisitos relacionados | FR-014 |
| Trigger | OS preparada aguardando liberação |
| Pré-condições | OS elegível para liberação |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | OS liberada para execução. |
| Decisões pendentes | DDP-003, DDP-015 |
| Critérios de aceite | AC-018, AC-019 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O autorizador consulta OS.
2. STEP_PENDING_DECISION — critérios mínimos de preparação.
3. O autorizador confirma liberação.
4. O sistema registra liberação com autoria e momento.

### Fluxos alternativos

- A1. Ator não autorizado — EX-003.

## UC-009 — Atribuir responsável à OS

| Campo | Valor |
| --- | --- |
| Objetivo | Atribuir responsável e registrar confirmação de recebimento se exigido. |
| Escopo | GLOBAL |
| Nível | SUBFUNCTION |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Operacional / planejador |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-071, EV-072, EV-073 |
| Regras | BR-019 |
| Requisitos relacionados | FR-015, FR-016 |
| Trigger | OS liberada ou em preparação avançada |
| Pré-condições | OS existente |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Responsável atribuído e evento registrado. |
| Decisões pendentes | DDP-015 |
| Critérios de aceite | AC-020, AC-021 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator seleciona responsável candidato.
2. O sistema registra atribuição.
3. STEP_PENDING_DECISION — confirmação de recebimento obrigatória ou opcional.
4. O responsável pode registrar visualização ou confirmação quando aplicável.

## UC-010 — Executar Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Objetivo | Iniciar e registrar progresso de execução em OS liberada. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Executor de serviço |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-044, EV-045, EV-046 |
| Regras | BR-006, BR-024 |
| Requisitos relacionados | FR-017, FR-018 |
| Trigger | OS liberada pronta para execução |
| Pré-condições | OS liberada |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Execução registrada. |
| Decisões pendentes | DDP-003 |
| Critérios de aceite | AC-022, AC-023 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O executor registra início de execução.
2. O executor registra progresso e realização.
3. O sistema preserva autoria e momento dos registros.

### Fluxos alternativos

- A1. OS não liberada — EX-003.

## UC-011 — Concluir Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Objetivo | Registrar conclusão de OS elegível. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Executor de serviço |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-045, EV-046 |
| Regras | BR-024 |
| Requisitos relacionados | FR-019 |
| Trigger | Serviço realizado |
| Pré-condições | OS em execução; Ator autorizado candidato |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | OS concluída. |
| Decisões pendentes | DDP-005 |
| Critérios de aceite | AC-024 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator solicita conclusão.
2. STEP_PENDING_DECISION — critérios de elegibilidade para conclusão.
3. O sistema registra conclusão.

## UC-012 — Cancelar Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Objetivo | Cancelar OS elegível mediante ator autorizado. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Autorizador empresarial |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-047 |
| Regras | BR-024 |
| Requisitos relacionados | FR-020 |
| Trigger | Necessidade de cancelamento |
| Pré-condições | OS elegível para cancelamento |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | OS cancelada. |
| Decisões pendentes | DDP-005 |
| Critérios de aceite | AC-025 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O autorizador solicita cancelamento.
2. STEP_PENDING_DECISION — tratamento de recursos já alocados.
3. O sistema registra cancelamento com autoria.

### Fluxos alternativos

- A1. Recursos alocados — EX-005.

## UC-013 — Reabrir Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Objetivo | Reabrir OS concluída somente se regra futura autorizar. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Autorizador empresarial |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-047 |
| Regras | BR-024 |
| Requisitos relacionados | FR-021 |
| Trigger | Necessidade de reabertura |
| Pré-condições | OS concluída |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Reabertura registrada ou bloqueada por pendência. |
| Decisões pendentes | DDP-005 |
| Critérios de aceite | AC-026 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. STEP_PENDING_DECISION — regra empresarial autoriza reabertura.
2. O autorizador solicita reabertura.
3. O sistema registra reabertura com justificativa candidata.

## UC-014 — Consultar histórico da OS

| Campo | Valor |
| --- | --- |
| Objetivo | Preservar e consultar histórico de alterações relevantes. |
| Escopo | GLOBAL |
| Nível | SUBFUNCTION |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Operacional / planejador |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-078, EV-079 |
| Regras | BR-023 |
| Requisitos relacionados | FR-022 |
| Trigger | Necessidade de auditoria ou consulta |
| Pré-condições | OS existente |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Histórico consultável. |
| Decisões pendentes | DDP-015 |
| Critérios de aceite | AC-027 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator solicita histórico.
2. O sistema apresenta alterações relevantes preservadas.
3. O sistema não remove histórico silenciosamente.

## UC-015 — Alocar e substituir recursos

| Campo | Valor |
| --- | --- |
| Objetivo | Alocar recurso específico, substituir e sinalizar conflitos. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Operacional / planejador |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-051, EV-053, EV-057 |
| Regras | BR-011, BR-012, BR-017 |
| Requisitos relacionados | FR-025, FR-026, FR-028 |
| Trigger | Planejamento concluído ou mudança em execução |
| Pré-condições | Itens planejados existentes |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Alocação ou substituição registrada. |
| Decisões pendentes | DDP-006, DDP-007 |
| Critérios de aceite | AC-030, AC-031, AC-033 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator aloca ativo ou pessoa a item planejado.
2. O sistema sinaliza possível conflito de alocação.
3. Durante execução, o ator registra substituição de recurso.
4. O sistema preserva histórico de alocação.

### Fluxos alternativos

- A1. Conflito detectado — EX-006.

## UC-016 — Registrar quantidade utilizada

| Campo | Valor |
| --- | --- |
| Objetivo | Registrar quantidade efetiva distinta da planejada. |
| Escopo | GLOBAL |
| Nível | SUBFUNCTION |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Executor de serviço |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-051, EV-064, EV-065 |
| Regras | BR-010 |
| Requisitos relacionados | FR-027 |
| Trigger | Divergência entre planejado e realizado |
| Pré-condições | Item com quantidade planejada |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Quantidade efetiva registrada. |
| Decisões pendentes | DDP-008 |
| Critérios de aceite | AC-032 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator informa quantidade efetivamente utilizada.
2. O sistema registra distinção entre planejado, alocado e realizado.

## UC-017 — Vincular referências comerciais

| Campo | Valor |
| --- | --- |
| Objetivo | Associar proposta, pedido, contrato ou PO preservando identificadores externos. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Operacional / planejador |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-055, EV-056, EV-059, EV-060 |
| Regras | BR-002, BR-008 |
| Requisitos relacionados | FR-029, FR-030 |
| Trigger | OS requer vínculo comercial |
| Pré-condições | OS em preparação ou execução |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Referência comercial vinculada. |
| Decisões pendentes | DDP-009, DDP-030 |
| Critérios de aceite | AC-034, AC-035 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator informa referência comercial candidata.
2. O sistema associa referência à OS.
3. O sistema preserva identificadores externos sem alteração silenciosa.

## UC-018 — Gerenciar custo e preço comercial

| Campo | Valor |
| --- | --- |
| Objetivo | Manter distinção custo/preço e restringir visualização de custo e margem. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Financeiro |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-058, EV-059, EV-060, EV-061 |
| Regras | BR-013, BR-018 |
| Requisitos relacionados | FR-031, FR-032 |
| Trigger | Registro de valores em itens elegíveis |
| Pré-condições | Itens com valores candidatos |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Valores registrados com restrição adequada. |
| Decisões pendentes | DDP-009 |
| Critérios de aceite | AC-036, AC-037, AC-038 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator registra custo interno e preço comercial separadamente.
2. O sistema mantém distinção conceitual.
3. O sistema restringe visualização de custo e margem a atores autorizados candidatos.

### Fluxos alternativos

- A1. Ator não autorizado consulta custo — EX-004.

## UC-019 — Controlar saldo de Purchase Order

| Campo | Valor |
| --- | --- |
| Objetivo | Registrar saldo autorizado e consumo candidato de PO vinculado. |
| Escopo | GLOBAL |
| Nível | SUBFUNCTION |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Financeiro |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-059, EV-060, EV-072 |
| Regras | BR-008 |
| Requisitos relacionados | FR-033 |
| Trigger | PO associado à OS |
| Pré-condições | PO vinculado |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Saldo e consumo registrados. |
| Decisões pendentes | DDP-009, DDP-030 |
| Critérios de aceite | AC-039 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator consulta saldo candidato.
2. O ator registra consumo candidato.
3. STEP_PENDING_DECISION — regra de bloqueio por saldo insuficiente.
4. O sistema registra movimentação candidata.

### Fluxos alternativos

- A1. Saldo insuficiente — EX-010.

## UC-020 — Identificar divergência comercial

| Campo | Valor |
| --- | --- |
| Objetivo | Identificar divergência entre pedido, execução e cobrança candidata. |
| Escopo | GLOBAL |
| Nível | SUBFUNCTION |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Financeiro |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-023, EV-056, EV-063 |
| Regras | BR-002, BR-009 |
| Requisitos relacionados | FR-034 |
| Trigger | Comparação comercial necessária |
| Pré-condições | Dados comerciais e de execução disponíveis |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Divergência registrada. |
| Decisões pendentes | DDP-010 |
| Critérios de aceite | AC-040 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O sistema compara referências candidatas.
2. O sistema registra divergência identificada.
3. O ator consulta divergência para tratamento empresarial.

## UC-021 — Preparar e submeter medição

| Campo | Valor |
| --- | --- |
| Objetivo | Preparar medição de itens executados e submeter para decisão. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Analista de medição |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-062, EV-063 |
| Regras | BR-009 |
| Requisitos relacionados | FR-035, FR-036 |
| Trigger | Execução elegível para medição |
| Pré-condições | Itens executados com origem identificável |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Medição preparada ou submetida. |
| Decisões pendentes | DDP-011 |
| Critérios de aceite | AC-041, AC-042 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O analista prepara medição com origem identificável.
2. STEP_PENDING_DECISION — periodicidade e granularidade.
3. O analista submete medição para decisão quando aplicável.

## UC-022 — Decidir sobre medição

| Campo | Valor |
| --- | --- |
| Objetivo | Aprovar ou rejeitar medição por ator autorizado quando regra existir. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Autorizador empresarial |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-062, EV-063 |
| Regras | BR-009 |
| Requisitos relacionados | FR-037 |
| Trigger | Medição submetida |
| Pré-condições | Medição preparada |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Decisão sobre medição registrada. |
| Decisões pendentes | DDP-011 |
| Critérios de aceite | AC-043 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. STEP_PENDING_DECISION — existência de fluxo de aprovação.
2. O autorizador registra decisão.
3. O sistema preserva decisão e motivo candidato.

### Fluxos alternativos

- A1. Medição divergente — EX-011.

## UC-023 — Registrar faturamento ou nota informada

| Campo | Valor |
| --- | --- |
| Objetivo | Exigir origem identificável e registrar documento de faturamento sem emissão fiscal pelo sistema. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Financeiro |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-017, EV-058, EV-062, EV-064, EV-066 |
| Regras | BR-014, BR-010, BR-015 |
| Requisitos relacionados | FR-038, FR-039 |
| Trigger | Necessidade de registrar cobrança |
| Pré-condições | Itens candidatos a cobrança |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Documento de faturamento registrado. |
| Decisões pendentes | DDP-010, DDP-023 |
| Critérios de aceite | AC-044, AC-045 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O sistema valida origem identificável dos itens.
2. O ator registra documento de faturamento ou nota informada.
3. O sistema não presume emissão fiscal interna.

### Fluxos alternativos

- A1. Origem ausente — EX-007.
- A2. Nota contestada — EX-012.

## UC-024 — Registrar evidências de execução

| Campo | Valor |
| --- | --- |
| Objetivo | Registrar evidências vinculadas a itens de OS. |
| Escopo | GLOBAL |
| Nível | SUBFUNCTION |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Executor de serviço |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-046, EV-067 |
| Regras | BR-024 |
| Requisitos relacionados | FR-040 |
| Trigger | Conclusão parcial ou total de item |
| Pré-condições | OS em execução ou concluída |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Evidência vinculada. |
| Decisões pendentes | DDP-002 |
| Critérios de aceite | AC-046 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O executor associa evidência a item de OS.
2. O sistema preserva vínculo e metadados candidatos.

### Fluxos alternativos

- A1. Documento inválido — EX-008.

## UC-025 — Gerenciar documentos lógicos

| Campo | Valor |
| --- | --- |
| Objetivo | Registrar documento lógico, versões, controlar acesso e substituição. |
| Escopo | GLOBAL |
| Nível | USER_GOAL |
| Status | PENDING_SOURCE_VALIDATION |
| Ator principal | Responsável documental |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-067, EV-068, EV-069, EV-070, EV-021, EV-022 |
| Regras | BR-016, BR-020 |
| Requisitos relacionados | FR-041, FR-042 |
| Trigger | Necessidade documental |
| Pré-condições | Ator com necessidade empresarial de documento |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Documento e versões gerenciados. |
| Decisões pendentes | DDP-012, DDP-013 |
| Critérios de aceite | AC-047, AC-048, AC-049, AC-050 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator registra documento lógico.
2. O ator adiciona versão documental e arquivo associado.
3. O ator solicita substituição quando necessário.
4. O sistema preserva versões anteriores.
5. O sistema controla acesso conforme necessidade empresarial.

### Fluxos alternativos

- A1. Versão concorrente — EX-009.

## UC-026 — Consultar informações operacionais agregadas

| Campo | Valor |
| --- | --- |
| Objetivo | Consultar relatórios candidatos sem inventar indicadores ou faixas de aging. |
| Escopo | GLOBAL |
| Nível | SUMMARY |
| Status | PENDING_BUSINESS_DECISION |
| Ator principal | Direção |
| Atores secundários | UNKNOWN |
| Stakeholders | Ver stakeholders-register |
| Fonte | SRC-001 |
| Evidências | EV-074, EV-075, EV-076 |
| Regras | BR-022 |
| Requisitos relacionados | FR-005, FR-022 |
| Trigger | Necessidade gerencial de visão consolidada |
| Pré-condições | Dados operacionais registrados |
| Garantia mínima | Dados preservados |
| Garantia de sucesso | Consulta atendida dentro do suportado. |
| Decisões pendentes | DDP-016 |
| Critérios de aceite | AC-051, AC-052 |
| Efeito financeiro | Desconhecido |
| Auditoria | CANDIDATE |

### Cenário principal

1. O ator solicita visão agregada candidata.
2. STEP_PENDING_DECISION — definição de indicadores permitidos.
3. O sistema apresenta informações disponíveis sem inventar fórmulas.
