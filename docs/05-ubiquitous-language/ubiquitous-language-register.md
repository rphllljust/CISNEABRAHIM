# UL-REG-001

| Campo | Valor |
| --- | --- |
| Document ID | Registro de linguagem ubíqua |
| Fonte | SRC-001 |
| Total | 48 termos (TERM-001..TERM-048) |
| ACCEPTED_FOR_DOCUMENTATION | 24 (não confirmado empresarialmente) |
| AMBIGUOUS | 18 |
| PENDING_BUSINESS_DECISION | 6 |
| CONFIRMED | 0 |
| Prompt | 04 |

> Definições **candidatas**. Nível de confiança máximo sem fonte primária: MEDIUM.

## Índice rápido

| ID | Termo preferencial | Domínio | Status |
| --- | --- | --- | --- |
| TERM-001 | Solicitação de serviço | Solicitação | ACCEPTED_FOR_DOCUMENTATION |
| TERM-002 | Ordem de Serviço (OS) | OS | AMBIGUOUS |
| TERM-003 | Serviço (operacional) | Escopo | AMBIGUOUS |
| TERM-004 | Cliente | Comercial | PENDING_BUSINESS_DECISION |
| TERM-005 | Solicitante | Solicitação | ACCEPTED_FOR_DOCUMENTATION |
| TERM-006 | Executor de serviço | Execução | PENDING_BUSINESS_DECISION |
| TERM-007 | Autorizador empresarial | Autorização | AMBIGUOUS |
| TERM-008 | Responsável pela OS | Responsabilidade | ACCEPTED_FOR_DOCUMENTATION |
| TERM-009 | Rascunho de OS | OS | AMBIGUOUS |
| TERM-010 | Liberação de OS | OS | AMBIGUOUS |
| TERM-011 | Proposta comercial | Comercial | PENDING_BUSINESS_DECISION |
| TERM-012 | Pedido do cliente | Comercial | AMBIGUOUS |
| TERM-013 | Purchase Order (PO) | Comercial | AMBIGUOUS |
| TERM-014 | Contrato comercial | Comercial | PENDING_BUSINESS_DECISION |
| TERM-015 | Referência comercial | Comercial | ACCEPTED_FOR_DOCUMENTATION |
| TERM-016 | Medição | Medição | AMBIGUOUS |
| TERM-017 | Faturamento (registro) | Financeiro | AMBIGUOUS |
| TERM-018 | Documento de faturamento informado | Financeiro | ACCEPTED_FOR_DOCUMENTATION |
| TERM-019 | Pagamento (registro) | Financeiro | PENDING_BUSINESS_DECISION |
| TERM-020 | Custo interno | Preço/custo | ACCEPTED_FOR_DOCUMENTATION |
| TERM-021 | Preço comercial | Preço/custo | ACCEPTED_FOR_DOCUMENTATION |
| TERM-022 | Margem | Preço/custo | PENDING_BUSINESS_DECISION |
| TERM-023 | Quantidade planejada | Quantidades | ACCEPTED_FOR_DOCUMENTATION |
| TERM-024 | Quantidade utilizada | Quantidades | ACCEPTED_FOR_DOCUMENTATION |
| TERM-025 | Equipamento | Recurso | AMBIGUOUS |
| TERM-026 | Veículo | Recurso | AMBIGUOUS |
| TERM-027 | Máquina | Recurso | AMBIGUOUS |
| TERM-028 | Mão de obra | Recurso | AMBIGUOUS |
| TERM-029 | Recurso (operacional) | Recurso | ACCEPTED_FOR_DOCUMENTATION |
| TERM-030 | Alocação de recurso | Recurso | ACCEPTED_FOR_DOCUMENTATION |
| TERM-031 | Documento lógico | Documento | ACCEPTED_FOR_DOCUMENTATION |
| TERM-032 | Versão documental | Documento | ACCEPTED_FOR_DOCUMENTATION |
| TERM-033 | Arquivo associado | Documento | ACCEPTED_FOR_DOCUMENTATION |
| TERM-034 | Evidência de execução | Execução | ACCEPTED_FOR_DOCUMENTATION |
| TERM-035 | Evidência (solicitação) | Solicitação | ACCEPTED_FOR_DOCUMENTATION |
| TERM-036 | WhatsApp (canal) | Canal | AMBIGUOUS |
| TERM-037 | Fonte da verdade (Source of Truth) | Integração | AMBIGUOUS |
| TERM-038 | Locação (escopo candidato) | Escopo | PENDING_BUSINESS_DECISION |
| TERM-039 | Envelhecimento operacional (aging) | Relatórios | PENDING_BUSINESS_DECISION |
| TERM-040 | Item faturável | Faturamento | ACCEPTED_FOR_DOCUMENTATION |
| TERM-041 | Origem de item faturável | Faturamento | ACCEPTED_FOR_DOCUMENTATION |
| TERM-042 | Divergência comercial | Comercial | ACCEPTED_FOR_DOCUMENTATION |
| TERM-043 | Substituição documental | Documento | ACCEPTED_FOR_DOCUMENTATION |
| TERM-044 | Histórico da OS | Auditoria | ACCEPTED_FOR_DOCUMENTATION |
| TERM-045 | Conversão (solicitação → OS) | Solicitação/OS | ACCEPTED_FOR_DOCUMENTATION |
| TERM-046 | Decisão sobre solicitação | Solicitação | ACCEPTED_FOR_DOCUMENTATION |
| TERM-047 | Decisão sobre medição | Medição | ACCEPTED_FOR_DOCUMENTATION |
| TERM-048 | Identificador externo comercial | Comercial | ACCEPTED_FOR_DOCUMENTATION |

---

## TERM-001 — Solicitação de serviço

| Campo | Valor |
| --- | --- |
| Term ID | TERM-001 |
| Termo preferencial | Solicitação de serviço |
| Definição candidata | Registro formal de pedido de serviço antes ou independente da OS, com identificador interno único candidato. |
| Significado empresarial | Ponto de entrada do controle desde a demanda até efeitos comerciais/financeiros (EV-005). |
| Significado excluído | Não é OS liberada; não é orçamento aprovado; não é nota fiscal. |
| Contexto | SERVICE_REQUEST |
| Fontes | SRC-001 |
| Evidências | EV-005, EV-027, EV-028 |
| BRs | BR-004 |
| FRs | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 |
| Atores | Solicitante; Autorizador empresarial |
| Sinônimos | Pedido de serviço (informal — evitar sem contexto) |
| Aliases | — |
| Termos confundidos | TERM-002 (OS); TERM-012 (pedido comercial) |
| Exemplos válidos | "Registrar solicitação de transporte com origem WhatsApp" |
| Exemplos inválidos | "Solicitação = OS já liberada" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-002, DDP-028 |

## TERM-002 — Ordem de Serviço (OS)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-002 |
| Termo preferencial | Ordem de Serviço (OS) |
| Definição candidata | Artefato que representa serviço planejado ou autorizado a executar, com ciclo de vida candidato (rascunho → liberação → execução → conclusão). |
| Significado empresarial | Unidade central de controle operacional citada em SRC-001 §4–§7. |
| Significado excluído | Não é solicitação bruta; não é nota fiscal; não é PO. |
| Contexto | SERVICE_ORDER |
| Fontes | SRC-001 |
| Evidências | EV-028, EV-036, EV-039, EV-042, EV-045, EV-046 |
| BRs | BR-001, BR-006, BR-007 |
| FRs | FR-010..FR-022 |
| Atores | Operacional; Autorizador; Executor; Responsável |
| Sinônimos | OS |
| Aliases | Ordem de serviço (grafia por extenso) |
| Termos confundidos | TERM-001; TERM-009; TERM-010 |
| Exemplos válidos | "Criar rascunho de OS a partir de solicitação aprovada" |
| Exemplos inválidos | "Toda solicitação já é OS" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-001, DDP-003, DDP-035 |

## TERM-003 — Serviço (operacional)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-003 |
| Termo preferencial | Serviço (operacional) |
| Definição candidata | Trabalho ou prestação que a empresa realiza ou coordena (transporte, locação, mão de obra, etc.) no contexto de uma solicitação ou OS. |
| Significado empresarial | Objeto do controle fim-a-fim (EV-005, EV-011). |
| Significado excluído | Não designa automaticamente módulo de software; não confirma escopo de release. |
| Contexto | PROCESS |
| Fontes | SRC-001 |
| Evidências | EV-011, EV-005 |
| BRs | BR-003 |
| FRs | (transversal) |
| Atores | Todos operacionais |
| Sinônimos | Prestação de serviço |
| Aliases | — |
| Termos confundidos | TERM-038 (locação como vertical) |
| Exemplos válidos | "Serviço de fretamento descrito na OS" |
| Exemplos inválidos | "Serviço = qualquer linha do ERP" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-026, DDP-035 |

## TERM-004 — Cliente

| Campo | Valor |
| --- | --- |
| Term ID | TERM-004 |
| Termo preferencial | Cliente |
| Definição candidata | Parte externa ou contraparte comercial que origina demanda ou possui vínculo comercial com a operação. |
| Significado empresarial | Ator citado em contexto comercial e cobrança (EV-047). |
| Significado excluído | Não é definido cadastro, CNPJ ou hierarquia nesta fase. |
| Contexto | COMMERCIAL |
| Fontes | SRC-001 |
| Evidências | EV-047, EV-029 |
| BRs | BR-024 |
| FRs | FR-002, FR-003 |
| Atores | Cliente externo (candidato) |
| Sinônimos | Contratante (informal — não equivalente) |
| Aliases | — |
| Termos confundidos | TERM-005 (solicitante interno) |
| Exemplos válidos | "Cliente solicitou serviço via representante" |
| Exemplos inválidos | "Cliente = usuário do sistema" (técnico) |
| Status | PENDING_BUSINESS_DECISION |
| Confiança | LOW |
| DDPs | DDP-002 |

## TERM-005 — Solicitante

| Campo | Valor |
| --- | --- |
| Term ID | TERM-005 |
| Termo preferencial | Solicitante |
| Definição candidata | Ator que inicia ou registra a solicitação de serviço, interno ou externo. |
| Significado empresarial | Origem da demanda rastreável (EV-029). |
| Significado excluído | Não é necessariamente quem aprova ou executa. |
| Contexto | SERVICE_REQUEST |
| Fontes | SRC-001 |
| Evidências | EV-029, EV-027 |
| BRs | BR-024 |
| FRs | FR-003 |
| Atores | Solicitante |
| Sinônimos | — |
| Aliases | Requerente (evitar) |
| Termos confundidos | TERM-004; TERM-007 |
| Exemplos válidos | "Solicitante anexou evidência à solicitação" |
| Exemplos inválidos | "Solicitante libera OS" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-028 |

## TERM-006 — Executor de serviço

| Campo | Valor |
| --- | --- |
| Term ID | TERM-006 |
| Termo preferencial | Executor de serviço |
| Definição candidata | Ator que realiza ou registra execução de serviço em OS liberada. |
| Significado empresarial | Responsável pela realização em campo ou operação (EV-037, EV-040). |
| Significado excluído | Não é papel técnico de sistema; não é sinônimo de "usuário". |
| Contexto | EXECUTION |
| Fontes | SRC-001 |
| Evidências | EV-037, EV-040, EV-044 |
| BRs | — |
| FRs | FR-017, FR-018, FR-040 |
| Atores | Executor de serviço; Motorista; Operador |
| Sinônimos | Executor |
| Aliases | — |
| Termos confundidos | TERM-008 (responsável pela OS) |
| Exemplos válidos | "Executor registra progresso da OS" |
| Exemplos inválidos | "Executor = qualquer login" |
| Status | PENDING_BUSINESS_DECISION |
| Confiança | MEDIUM |
| DDPs | DDP-006 |

## TERM-007 — Autorizador empresarial

| Campo | Valor |
| --- | --- |
| Term ID | TERM-007 |
| Termo preferencial | Autorizador empresarial |
| Definição candidata | Ator com alçada candidata para aprovar, rejeitar, liberar ou cancelar conforme regras empresariais. |
| Significado empresarial | "Pessoa autorizada" de SRC-001 sem cargo nomeado (EV-038, EV-039). |
| Significado excluído | Não é role técnica RBAC; não é admin de sistema. |
| Contexto | AUTHORIZATION |
| Fontes | SRC-001 |
| Evidências | EV-013, EV-036, EV-038, EV-039 |
| BRs | BR-006 |
| FRs | FR-006, FR-014, FR-020 |
| Atores | Autorizador empresarial |
| Sinônimos | Pessoa autorizada (linguagem da fonte) |
| Aliases | Gestão (evitar — TERM ambíguo EV-080) |
| Termos confundidos | TERM-008; perfil "admin" |
| Exemplos válidos | "Autorizador empresarial libera OS" |
| Exemplos inválidos | "Autorizador = DBA" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-003, DDP-015 |

## TERM-008 — Responsável pela OS

| Campo | Valor |
| --- | --- |
| Term ID | TERM-008 |
| Termo preferencial | Responsável pela OS |
| Definição candidata | Ator designado como accountable pela condução da OS após atribuição. |
| Significado empresarial | Handoff e rastreabilidade de quem recebeu a responsabilidade (EV-071, EV-073). |
| Significado excluído | Não é necessariamente quem executa fisicamente o serviço. |
| Contexto | RESPONSIBILITY |
| Fontes | SRC-001 |
| Evidências | EV-071, EV-072, EV-073, EV-084 |
| BRs | BR-019, BR-021 |
| FRs | FR-015, FR-016 |
| Atores | Responsável pela OS |
| Sinônimos | Responsável operacional |
| Aliases | — |
| Termos confundidos | TERM-006 |
| Exemplos válidos | "Atribuir responsável à OS" |
| Exemplos inválidos | "Responsável = dono do veículo no ERP" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-032 |

## TERM-009 — Rascunho de OS

| Campo | Valor |
| --- | --- |
| Term ID | TERM-009 |
| Termo preferencial | Rascunho de OS |
| Definição candidata | Estado candidato em que OS existe para preparação sem estar liberada para execução. |
| Significado empresarial | Distinção preparação vs liberação (EV-042, BR-007). |
| Significado excluído | Não é versão documental; não é solicitação. |
| Contexto | SERVICE_ORDER |
| Fontes | SRC-001 |
| Evidências | EV-042, EV-041 |
| BRs | BR-007, BR-025 |
| FRs | FR-010 |
| Atores | Operacional |
| Sinônimos | Rascunho |
| Aliases | Draft (somente nota técnica — não preferencial) |
| Termos confundidos | TERM-032 (versão documental) |
| Exemplos válidos | "OS em rascunho aguardando conteúdo" |
| Exemplos inválidos | "Rascunho = OS cancelada" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-001, DDP-022 |

## TERM-010 — Liberação de OS

| Campo | Valor |
| --- | --- |
| Term ID | TERM-010 |
| Termo preferencial | Liberação de OS |
| Definição candidata | Ato empresarial autorizado que torna OS elegível à execução conforme regras futuras. |
| Significado empresarial | Controle para evitar OS sem autorização (EV-007, EV-039). |
| Significado excluído | Não é início automático de execução; não é faturamento. |
| Contexto | SERVICE_ORDER |
| Fontes | SRC-001 |
| Evidências | EV-039, EV-013, EV-036 |
| BRs | BR-006 |
| FRs | FR-014 |
| Atores | Autorizador empresarial |
| Sinônimos | Liberar OS |
| Aliases | — |
| Termos confundidos | TERM-045 (conversão); aprovação de solicitação |
| Exemplos válidos | "Liberar OS após preparação" |
| Exemplos inválidos | "Salvar rascunho = liberar" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-003, DDP-029 |

## TERM-011 — Proposta comercial

| Campo | Valor |
| --- | --- |
| Term ID | TERM-011 |
| Termo preferencial | Proposta comercial |
| Definição candidata | Oferta ou proposta que pode anteceder pedido, contrato ou OS — encadeamento não fixado. |
| Significado empresarial | Referência comercial citada (EV-055). |
| Significado excluído | Não confirmada como entidade obrigatória no sistema. |
| Contexto | COMMERCIAL |
| Fontes | SRC-001 |
| Evidências | EV-055, EV-056 |
| BRs | BR-002 |
| FRs | FR-029 |
| Atores | Comercial |
| Sinônimos | Proposta |
| Aliases | — |
| Termos confundidos | TERM-012, TERM-013, TERM-014 |
| Exemplos válidos | "Referenciar proposta na OS" |
| Exemplos inválidos | "Proposta = OS" |
| Status | PENDING_BUSINESS_DECISION |
| Confiança | LOW |
| DDPs | DDP-009, DDP-030 |

## TERM-012 — Pedido do cliente

| Campo | Valor |
| --- | --- |
| Term ID | TERM-012 |
| Termo preferencial | Pedido do cliente |
| Definição candidata | Pedido comercial do cliente distinto de PO e de solicitação operacional interna. |
| Significado empresarial | Vínculo comercial (EV-055). |
| Significado excluído | Não é sinônimo de solicitação de serviço sem validação. |
| Contexto | COMMERCIAL |
| Fontes | SRC-001 |
| Evidências | EV-055, EV-056 |
| BRs | BR-002 |
| FRs | FR-029, FR-030 |
| Atores | Cliente; Comercial |
| Sinônimos | Pedido |
| Aliases | — |
| Termos confundidos | TERM-001; TERM-013 |
| Exemplos válidos | "Preservar ID do pedido do cliente na OS" |
| Exemplos inválidos | "Pedido = PO sempre" |
| Status | AMBIGUOUS |
| Confiança | LOW |
| DDPs | DDP-009 |

## TERM-013 — Purchase Order (PO)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-013 |
| Termo preferencial | Purchase Order (PO) |
| Definição candidata | Ordem de compra ou referência de limite comercial externa com saldo/consumo candidato. |
| Significado empresarial | Controle de limite e consumo (EV-059, EV-060). |
| Significado excluído | Não é OS operacional; cardinalidade com proposta/contrato TBD. |
| Contexto | COMMERCIAL |
| Fontes | SRC-001 |
| Evidências | EV-059, EV-060, EV-072 |
| BRs | BR-008 |
| FRs | FR-033 |
| Atores | Financeiro; Comercial |
| Sinônimos | PO |
| Aliases | Ordem de compra |
| Termos confundidos | TERM-012; TERM-002 |
| Exemplos válidos | "Registrar consumo candidato de PO" |
| Exemplos inválidos | "PO = Ordem de Serviço" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-009 |

## TERM-014 — Contrato comercial

| Campo | Valor |
| --- | --- |
| Term ID | TERM-014 |
| Termo preferencial | Contrato comercial |
| Definição candidata | Acordo comercial de referência citado sem detalhamento na fonte. |
| Significado empresarial | Possível origem de condições e referências (EV-055). |
| Significado excluído | Não modelado; termos legais não inferidos. |
| Contexto | COMMERCIAL |
| Fontes | SRC-001 |
| Evidências | EV-055 |
| BRs | BR-002 |
| FRs | FR-029 |
| Atores | Comercial |
| Sinônimos | Contrato |
| Aliases | — |
| Termos confundidos | TERM-011, TERM-013 |
| Exemplos válidos | "Referência a contrato na OS" |
| Exemplos inválidos | "Contrato importado automaticamente" (não afirmado) |
| Status | PENDING_BUSINESS_DECISION |
| Confiança | LOW |
| DDPs | DDP-009 |

## TERM-015 — Referência comercial

| Campo | Valor |
| --- | --- |
| Term ID | TERM-015 |
| Termo preferencial | Referência comercial |
| Definição candidata | Vínculo genérico a proposta, pedido, contrato ou PO sem fixar cardinalidade. |
| Significado empresarial | Rastreabilidade comercial da OS (EV-055, EV-056). |
| Significado excluído | Não substitui entidade comercial específica. |
| Contexto | COMMERCIAL |
| Fontes | SRC-001 |
| Evidências | EV-055, EV-056, EV-059 |
| BRs | BR-002 |
| FRs | FR-029 |
| Atores | Operacional; Comercial |
| Sinônimos | — |
| Aliases | Ref. comercial |
| Termos confundidos | TERM-048 |
| Exemplos válidos | "Registrar referência comercial na OS" |
| Exemplos inválidos | "Referência comercial = nota fiscal" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-009 |

## TERM-016 — Medição

| Campo | Valor |
| --- | --- |
| Term ID | TERM-016 |
| Termo preferencial | Medição |
| Definição candidata | Processo candidato de apurar itens executados para decisão e possível faturamento. |
| Significado empresarial | Ponte execução → cobrança (EV-062, EV-063). |
| Significado excluído | Não é sinônimo de execução completa; processo inteiro TBD. |
| Contexto | MEASUREMENT |
| Fontes | SRC-001 |
| Evidências | EV-062, EV-063, EV-073 |
| BRs | BR-009 |
| FRs | FR-035, FR-036, FR-037 |
| Atores | Analista de medição; Autorizador |
| Sinônimos | — |
| Aliases | — |
| Termos confundidos | TERM-024 (quantidade); TERM-017 |
| Exemplos válidos | "Preparar medição de itens executados" |
| Exemplos inválidos | "Medição = nota emitida" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-010, DDP-011 |

## TERM-017 — Faturamento (registro)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-017 |
| Termo preferencial | Faturamento (registro) |
| Definição candidata | Registro candidato de intenção ou documento de cobrança sem presumir emissão fiscal pelo sistema. |
| Significado empresarial | Ligação serviço executado → cobrança (EV-074). |
| Significado excluído | Não é emissão de NF-e pelo sistema; não é pagamento recebido. |
| Contexto | BILLING |
| Fontes | SRC-001 |
| Evidências | EV-074, EV-064 |
| BRs | BR-014, BR-015 |
| FRs | FR-039 |
| Atores | Financeiro |
| Sinônimos | Cobrança (informal — distinto de pagamento) |
| Aliases | — |
| Termos confundidos | TERM-018; TERM-019 |
| Exemplos válidos | "Registrar faturamento informado externamente" |
| Exemplos inválidos | "Faturamento = sistema emite nota fiscal" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-011, DDP-023 |

## TERM-018 — Documento de faturamento informado

| Campo | Valor |
| --- | --- |
| Term ID | TERM-018 |
| Termo preferencial | Documento de faturamento informado |
| Definição candidata | Registro de nota ou documento de cobrança informado, tipicamente emitido fora do sistema. |
| Significado empresarial | EV-064, EV-066 — sem modo fiscal fixado. |
| Significado excluído | Não é documento fiscal emitido pelo sistema. |
| Contexto | BILLING |
| Fontes | SRC-001 |
| Evidências | EV-064, EV-065, EV-066 |
| BRs | BR-015 |
| FRs | FR-039 |
| Atores | Financeiro |
| Sinônimos | Nota informada; fatura informada |
| Aliases | — |
| Termos confundidos | TERM-031 (documento lógico genérico) |
| Exemplos válidos | "Registrar número de nota emitida no ERP externo" |
| Exemplos inválidos | "Nota = evidência de execução" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-023 |

## TERM-019 — Pagamento (registro)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-019 |
| Termo preferencial | Pagamento (registro) |
| Definição candidata | Registro candidato de pagamento recebido ou efetuado quando Source of Truth definido. |
| Significado empresarial | Citado em efeitos financeiros (EV-074). |
| Significado excluído | Não é conciliação bancária automática afirmada. |
| Contexto | FINANCIAL |
| Fontes | SRC-001 |
| Evidências | EV-074, EV-064 |
| BRs | — |
| FRs | (futuro — FR-039 adjacente) |
| Atores | Financeiro |
| Sinônimos | — |
| Aliases | — |
| Termos confundidos | TERM-017; TERM-018 |
| Exemplos válidos | "Pagamento atrasado identificado como condição candidata" |
| Exemplos inválidos | "Pagamento registrado automaticamente pelo banco" |
| Status | PENDING_BUSINESS_DECISION |
| Confiança | LOW |
| DDPs | DDP-012, DDP-020 |

## TERM-020 — Custo interno

| Campo | Valor |
| --- | --- |
| Term ID | TERM-020 |
| Termo preferencial | Custo interno |
| Definição candidata | Valor de custo da empresa para realizar serviço, distinto do preço cobrado. |
| Significado empresarial | Gestão de margem (EV-058, EV-061). |
| Significado excluído | Não visível a todos os atores; não é preço comercial. |
| Contexto | PRICING |
| Fontes | SRC-001 |
| Evidências | EV-058, EV-061 |
| BRs | BR-018 |
| FRs | FR-031, FR-032 |
| Atores | Financeiro; Direção |
| Sinônimos | Custo |
| Aliases | — |
| Termos confundidos | TERM-021 |
| Exemplos válidos | "Separar custo interno e preço comercial" |
| Exemplos inválidos | "Custo = preço na proposta ao cliente" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-030 |

## TERM-021 — Preço comercial

| Campo | Valor |
| --- | --- |
| Term ID | TERM-021 |
| Termo preferencial | Preço comercial |
| Definição candidata | Valor ou condição de cobrança acordada comercialmente com o cliente. |
| Significado empresarial | Base de cobrança (EV-058, EV-059). |
| Significado excluído | Não fundido com custo interno (VR-008). |
| Contexto | PRICING |
| Fontes | SRC-001 |
| Evidências | EV-058, EV-059, EV-061 |
| BRs | BR-018 |
| FRs | FR-031 |
| Atores | Comercial; Financeiro |
| Sinônimos | Preço |
| Aliases | — |
| Termos confundidos | TERM-020 |
| Exemplos válidos | "Preço comercial por item na OS" |
| Exemplos inválidos | "Preço = custo + margem fixa" (regra não confirmada) |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-031 |

## TERM-022 — Margem

| Campo | Valor |
| --- | --- |
| Term ID | TERM-022 |
| Termo preferencial | Margem |
| Definição candidata | Diferença ou relação entre custo interno e preço comercial — fórmula não definida. |
| Significado empresarial | Citada como dado sensível (EV-060, EV-061). |
| Significado excluído | Não é percentual fixo inventado. |
| Contexto | PRICING |
| Fontes | SRC-001 |
| Evidências | EV-060, EV-061, EV-078 |
| BRs | BR-018 |
| FRs | FR-032 |
| Atores | Financeiro; Direção |
| Sinônimos | — |
| Aliases | — |
| Termos confundidos | TERM-021; markup genérico |
| Exemplos válidos | "Restringir visualização de margem" |
| Exemplos inválidos | "Margem = 30%" |
| Status | PENDING_BUSINESS_DECISION |
| Confiança | LOW |
| DDPs | DDP-030, DDP-031 |

## TERM-023 — Quantidade planejada

| Campo | Valor |
| --- | --- |
| Term ID | TERM-023 |
| Termo preferencial | Quantidade planejada |
| Definição candidata | Quantidade prevista no planejamento da OS ou item antes da execução. |
| Significado empresarial | Fase ITEM_PLANNED / planejamento (EV-049, EV-064). |
| Significado excluído | Não é quantidade faturada nem executada. |
| Contexto | QUANTITIES |
| Fontes | SRC-001 |
| Evidências | EV-049, EV-050, EV-064 |
| BRs | BR-010 |
| FRs | FR-012, FR-027 |
| Atores | Operacional |
| Sinônimos | Qtd. planejada |
| Aliases | — |
| Termos confundidos | TERM-024 |
| Exemplos válidos | "12 horas planejadas de mão de obra" |
| Exemplos inválidos | "Planejado = utilizado sempre" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-030 |

## TERM-024 — Quantidade utilizada

| Campo | Valor |
| --- | --- |
| Term ID | TERM-024 |
| Termo preferencial | Quantidade utilizada |
| Definição candidata | Quantidade efetivamente registrada na execução, podendo diferir da planejada. |
| Significado empresarial | Realizado vs planejado (EV-051, EV-064, EV-065). |
| Significado excluído | Não é sinônimo automático de medição aprovada. |
| Contexto | QUANTITIES |
| Fontes | SRC-001 |
| Evidências | EV-051, EV-064, EV-065 |
| BRs | BR-010 |
| FRs | FR-027 |
| Atores | Executor |
| Sinônimos | Quantidade realizada; quantidade efetiva |
| Aliases | — |
| Termos confundidos | TERM-023; TERM-016 |
| Exemplos válidos | "Registrar 10h utilizadas quando 12h planejadas" |
| Exemplos inválidos | "Utilizada = faturada automaticamente" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-010 |

## TERM-025 — Equipamento

| Campo | Valor |
| --- | --- |
| Term ID | TERM-025 |
| Termo preferencial | Equipamento |
| Definição candidata | Ativo ou equipamento alocável à OS, distinto de veículo quando aplicável. |
| Significado empresarial | Recurso material (EV-050, EV-051). |
| Significado excluído | Não é cadastro ERP confirmado; não é tipo genérico apenas. |
| Contexto | RESOURCE |
| Fontes | SRC-001 |
| Evidências | EV-050, EV-051, EV-052 |
| BRs | BR-011 |
| FRs | FR-024, FR-025 |
| Atores | Operacional; Operador de equipamento |
| Sinônimos | — |
| Aliases | — |
| Termos confundidos | TERM-026; TERM-027 |
| Exemplos válidos | "Alocar equipamento X ao item da OS" |
| Exemplos inválidos | "Equipamento = qualquer recurso" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-007, DDP-034 |

## TERM-026 — Veículo

| Campo | Valor |
| --- | --- |
| Term ID | TERM-026 |
| Termo preferencial | Veículo |
| Definição candidata | Veículo da frota ou terceiro utilizado na prestação do serviço. |
| Significado empresarial | Subtipo de recurso em transportes (EV-050). |
| Significado excluído | Não confirma propriedade (próprio/terceiro). |
| Contexto | RESOURCE |
| Fontes | SRC-001 |
| Evidências | EV-050, EV-051, EV-052 |
| BRs | BR-011 |
| FRs | FR-024, FR-025 |
| Atores | Motorista |
| Sinônimos | — |
| Aliases | Viatura (informal) |
| Termos confundidos | TERM-025 |
| Exemplos válidos | "Planejar veículo na OS" |
| Exemplos inválidos | "Veículo = equipamento sempre" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-008, DDP-034 |

## TERM-027 — Máquina

| Campo | Valor |
| --- | --- |
| Term ID | TERM-027 |
| Termo preferencial | Máquina |
| Definição candidata | Máquina ou equipamento pesado em contexto de locação ou serviço com operador. |
| Significado empresarial | Atividade de locação citada (EV-049, EV-080). |
| Significado excluído | Não confirma escopo de locação no release. |
| Contexto | RESOURCE |
| Fontes | SRC-001 |
| Evidências | EV-049, EV-050 |
| BRs | BR-011 |
| FRs | FR-024 |
| Atores | Operador de equipamento |
| Sinônimos | — |
| Aliases | — |
| Termos confundidos | TERM-025; TERM-038 |
| Exemplos válidos | "Locação de máquina sem operador (candidato)" |
| Exemplos inválidos | "Máquina = veículo leve" |
| Status | AMBIGUOUS |
| Confiança | LOW |
| DDPs | DDP-007, DDP-026 |

## TERM-028 — Mão de obra

| Campo | Valor |
| --- | --- |
| Term ID | TERM-028 |
| Termo preferencial | Mão de obra |
| Definição candidata | Trabalho humano planejado ou alocado à OS (pessoa ou função). |
| Significado empresarial | Recurso humano vs observação livre (EV-054, EV-055). |
| Significado excluído | Não é folha de pagamento; não é tipo fechado de função. |
| Contexto | RESOURCE |
| Fontes | SRC-001 |
| Evidências | EV-054, EV-055, EV-057 |
| BRs | BR-012 |
| FRs | FR-023 |
| Atores | Operacional; RH (candidato) |
| Sinônimos | MO |
| Aliases | Mão-de-obra |
| Termos confundidos | TERM-006; ajudante/motorista sem taxonomia |
| Exemplos válidos | "Planejar mão de obra na OS" |
| Exemplos inválidos | "Mão de obra = campo texto livre apenas" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-006 |

## TERM-029 — Recurso (operacional)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-029 |
| Termo preferencial | Recurso (operacional) |
| Definição candidata | Termo guarda-chuva para mão de obra, equipamento, veículo ou máquina alocável. |
| Significado empresarial | Planejamento e alocação (EV-049, EV-051). |
| Significado excluído | Não é material de consumo genérico; não é recurso de TI. |
| Contexto | RESOURCE |
| Fontes | SRC-001 |
| Evidências | EV-049, EV-051, EV-053 |
| BRs | BR-011, BR-017 |
| FRs | FR-013, FR-025, FR-026 |
| Atores | Operacional |
| Sinônimos | Recurso |
| Aliases | — |
| Termos confundidos | TERM-025..028 (específicos) |
| Exemplos válidos | "Planejar recursos necessários na OS" |
| Exemplos inválidos | "Recurso = usuário do sistema" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-007 |

## TERM-030 — Alocação de recurso

| Campo | Valor |
| --- | --- |
| Term ID | TERM-030 |
| Termo preferencial | Alocação de recurso |
| Definição candidata | Vínculo de recurso específico a item ou período da OS. |
| Significado empresarial | Controle de uso e conflito (EV-051, EV-053). |
| Significado excluído | Não é apenas planejamento genérico por tipo. |
| Contexto | RESOURCE |
| Fontes | SRC-001 |
| Evidências | EV-051, EV-053, EV-057 |
| BRs | BR-017 |
| FRs | FR-025, FR-028 |
| Atores | Operacional |
| Sinônimos | Alocar recurso |
| Aliases | — |
| Termos confundidos | TERM-023 (planejamento) |
| Exemplos válidos | "Alocar motorista João ao item 2" |
| Exemplos inválidos | "Alocação = substituição automática" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-007 |

## TERM-031 — Documento lógico

| Campo | Valor |
| --- | --- |
| Term ID | TERM-031 |
| Termo preferencial | Documento lógico |
| Definição candidata | Entidade documental de negócio distinta de arquivo físico e de versão. |
| Significado empresarial | Modelo documento lógico × versão × arquivo (EV-067, EV-081). |
| Significado excluído | Não é linha de OS; não é solicitação. |
| Contexto | DOCUMENT |
| Fontes | SRC-001 |
| Evidências | EV-067, EV-081 |
| BRs | BR-016 |
| FRs | FR-041 |
| Atores | Responsável documental |
| Sinônimos | Documento (quando contexto documental explícito) |
| Aliases | — |
| Termos confundidos | TERM-033; TERM-018 |
| Exemplos válidos | "Criar documento lógico 'Contrato XYZ'" |
| Exemplos inválidos | "Documento = qualquer anexo sem entidade" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-013, DDP-033 |

## TERM-032 — Versão documental

| Campo | Valor |
| --- | --- |
| Term ID | TERM-032 |
| Termo preferencial | Versão documental |
| Definição candidata | Instância versionada de um documento lógico ao longo do tempo. |
| Significado empresarial | Preservação histórica (EV-068, EV-082). |
| Significado excluído | Não é rascunho de OS; não é revisão de código. |
| Contexto | DOCUMENT |
| Fontes | SRC-001 |
| Evidências | EV-068, EV-069, EV-082 |
| BRs | BR-016 |
| FRs | FR-041, FR-042 |
| Atores | Responsável documental |
| Sinônimos | Versão |
| Aliases | — |
| Termos confundidos | TERM-009 |
| Exemplos válidos | "Adicionar versão 2 ao documento lógico" |
| Exemplos inválidos | "Nova versão apaga a anterior" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-013 |

## TERM-033 — Arquivo associado

| Campo | Valor |
| --- | --- |
| Term ID | TERM-033 |
| Termo preferencial | Arquivo associado |
| Definição candidata | Arquivo binário ou arquivo armazenado vinculado a versão documental ou evidência. |
| Significado empresarial | Camada de persistência de arquivo (EV-069). |
| Significado excluído | Não é o documento lógico inteiro. |
| Contexto | DOCUMENT |
| Fontes | SRC-001 |
| Evidências | EV-069, EV-067 |
| BRs | BR-016 |
| FRs | FR-041 |
| Atores | Responsável documental; Executor |
| Sinônimos | Arquivo anexo |
| Aliases | — |
| Termos confundidos | TERM-031 |
| Exemplos válidos | "PDF associado à versão 1" |
| Exemplos inválidos | "Arquivo = documento lógico" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-013 |

## TERM-034 — Evidência de execução

| Campo | Valor |
| --- | --- |
| Term ID | TERM-034 |
| Termo preferencial | Evidência de execução |
| Definição candidata | Comprovante ou registro de que serviço foi realizado, vinculado à OS em execução ou concluída. |
| Significado empresarial | Comprovação operacional (EV-046, EV-067). |
| Significado excluído | Não é evidência atômica EV-* do registro Prompt 01. |
| Contexto | EXECUTION |
| Fontes | SRC-001 |
| Evidências | EV-046, EV-067 |
| BRs | — |
| FRs | FR-040 |
| Atores | Executor |
| Sinônimos | Comprovante operacional |
| Aliases | — |
| Termos confundidos | TERM-035; TERM-033 |
| Exemplos válidos | "Foto de entrega anexada à OS" |
| Exemplos inválidos | "Evidência de execução = nota fiscal" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-013 |

## TERM-035 — Evidência (solicitação)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-035 |
| Termo preferencial | Evidência (solicitação) |
| Definição candidata | Anexo ou informação de suporte vinculada à solicitação de serviço. |
| Significado empresarial | Contexto inicial da demanda (EV-030). |
| Significado excluído | Não é registro atômico EV-*; não é documento lógico versionado obrigatório. |
| Contexto | SERVICE_REQUEST |
| Fontes | SRC-001 |
| Evidências | EV-030 |
| BRs | — |
| FRs | FR-004 |
| Atores | Solicitante |
| Sinônimos | Anexo à solicitação |
| Aliases | — |
| Termos confundidos | TERM-034 |
| Exemplos válidos | "Anexar e-mail do cliente à solicitação" |
| Exemplos inválidos | "Evidência = qualquer campo texto" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-002 |

## TERM-036 — WhatsApp (canal)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-036 |
| Termo preferencial | WhatsApp (canal) |
| Definição candidata | Canal de comunicação candidato para origem ou notificação de solicitação/serviço. |
| Significado empresarial | Citado como canal e integração (EV-027, EV-032, EV-077). |
| Significado excluído | CAPABILITY_ONLY — não REQUIRED; não é Source of Truth. |
| Contexto | CHANNEL |
| Fontes | SRC-001 |
| Evidências | EV-027, EV-032, EV-077 |
| BRs | BR-005 |
| FRs | FR-002 |
| Atores | Solicitante; Sistema externo |
| Sinônimos | — |
| Aliases | Mensageria (genérico) |
| Termos confundidos | INT-REQ-004; integração genérica |
| Exemplos válidos | "Origem da solicitação: WhatsApp" |
| Exemplos inválidos | "WhatsApp substitui cadastro no sistema" |
| Status | AMBIGUOUS |
| Confiança | MEDIUM |
| DDPs | DDP-021 |

## TERM-037 — Fonte da verdade (Source of Truth)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-037 |
| Termo preferencial | Fonte da verdade (Source of Truth) |
| Definição candidata | Sistema ou registro autoritativo para determinado dado comercial, fiscal ou operacional. |
| Significado empresarial | Princípio de integração (DDP-020, EV-077). |
| Significado excluído | Não afirma que CISNE será SoT de tudo. |
| Contexto | INTEGRATION |
| Fontes | SRC-001 |
| Evidências | EV-077 |
| BRs | — |
| FRs | FR-030 |
| Atores | Arquitetura; Comercial |
| Sinônimos | Source of Truth; SoT |
| Aliases | SoT (sigla — contexto técnico) |
| Termos confundidos | sistema único; ERP |
| Exemplos válidos | "ERP é SoT de PO — hipótese a validar" |
| Exemplos inválidos | "SoT = WhatsApp" |
| Status | AMBIGUOUS |
| Confiança | LOW |
| DDPs | DDP-020 |

## TERM-038 — Locação (escopo candidato)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-038 |
| Termo preferencial | Locação (escopo candidato) |
| Definição candidata | Vertical de negócio de aluguel de veículos, máquinas ou equipamentos — prioridade econômica candidata. |
| Significado empresarial | FUTURE_SCOPE_CANDIDATE (EV-080). |
| Significado excluído | Não é escopo confirmado do primeiro release. |
| Contexto | SCOPE |
| Fontes | SRC-001 |
| Evidências | EV-080, EV-002 |
| BRs | BR-020 |
| FRs | — |
| Atores | Direção |
| Sinônimos | Aluguel |
| Aliases | — |
| Termos confundidos | TERM-003 (serviço genérico) |
| Exemplos válidos | "Locação como atividade futura candidata" |
| Exemplos inválidos | "Locação no MVP obrigatória" |
| Status | PENDING_BUSINESS_DECISION |
| Confiança | MEDIUM |
| DDPs | DDP-026 |

## TERM-039 — Envelhecimento operacional (aging)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-039 |
| Termo preferencial | Envelhecimento operacional (aging) |
| Definição candidata | Tempo em que artefato permanece em estado sem progresso — sem faixas definidas. |
| Significado empresarial | Relatórios e gargalos (EV-074, EV-075). |
| Significado excluído | Não são SLAs numéricos inventados. |
| Contexto | REPORTING |
| Fontes | SRC-001 |
| Evidências | EV-074, EV-075, EV-076 |
| BRs | BR-022 |
| FRs | FR-005; RPT-REQ-* |
| Atores | Direção; Operacional |
| Sinônimos | Aging; tempo parado |
| Aliases | — |
| Termos confundidos | TERM-039 vs SLA |
| Exemplos válidos | "OS parada há tempo indefinido — relatório candidato" |
| Exemplos inválidos | "Aging > 48h bloqueia sistema" |
| Status | PENDING_BUSINESS_DECISION |
| Confiança | LOW |
| DDPs | DDP-024 |

## TERM-040 — Item faturável

| Campo | Valor |
| --- | --- |
| Term ID | TERM-040 |
| Termo preferencial | Item faturável |
| Definição candidata | Item ou linha candidata a cobrança derivada de execução ou medição. |
| Significado empresarial | Pré-requisito de faturamento (EV-017, EV-058). |
| Significado excluído | Não é nota emitida. |
| Contexto | BILLING |
| Fontes | SRC-001 |
| Evidências | EV-017, EV-058, EV-062 |
| BRs | BR-014 |
| FRs | FR-038 |
| Atores | Financeiro |
| Sinônimos | — |
| Aliases | — |
| Termos confundidos | TERM-018 |
| Exemplos válidos | "Item faturável sem origem — bloquear" |
| Exemplos inválidos | "Todo item da OS é faturável automaticamente" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-011 |

## TERM-041 — Origem de item faturável

| Campo | Valor |
| --- | --- |
| Term ID | TERM-041 |
| Termo preferencial | Origem de item faturável |
| Definição candidata | Vínculo rastreável a OS, medição, contrato ou PO que justifica cobrança. |
| Significado empresarial | Rastreabilidade cobrança (EV-017, EV-062). |
| Significado excluído | Não é opcional quando regra preliminar aplicável. |
| Contexto | BILLING |
| Fontes | SRC-001 |
| Evidências | EV-017, EV-058, EV-062 |
| BRs | BR-014 |
| FRs | FR-038 |
| Atores | Financeiro |
| Sinônimos | Origem faturável |
| Aliases | — |
| Termos confundidos | TERM-015 |
| Exemplos válidos | "Origem = medição M-123" |
| Exemplos inválidos | "Origem = desconhecida aceita" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-010, DDP-011 |

## TERM-042 — Divergência comercial

| Campo | Valor |
| --- | --- |
| Term ID | TERM-042 |
| Termo preferencial | Divergência comercial |
| Definição candidata | Inconsistência identificada entre dados comerciais (preço, PO, execução, medição). |
| Significado empresarial | Tratamento de exceção comercial (EV-023, EV-063). |
| Significado excluído | Não é erro técnico de sistema apenas. |
| Contexto | COMMERCIAL |
| Fontes | SRC-001 |
| Evidências | EV-023, EV-056, EV-063 |
| BRs | BR-002 |
| FRs | FR-034 |
| Atores | Comercial; Financeiro |
| Sinônimos | Inconsistência comercial |
| Aliases | — |
| Termos confundidos | bug; falha de integração |
| Exemplos válidos | "Divergência entre PO e consumo registrado" |
| Exemplos inválidos | "Divergência = rejeitar OS automaticamente" (regra TBD) |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-009 |

## TERM-043 — Substituição documental

| Campo | Valor |
| --- | --- |
| Term ID | TERM-043 |
| Termo preferencial | Substituição documental |
| Definição candidata | Ato de publicar nova versão documental substituindo vigência anterior sem apagar histórico. |
| Significado empresarial | Controle documental (EV-082, FR-042). |
| Significado excluído | Não é delete físico obrigatório da versão anterior. |
| Contexto | DOCUMENT |
| Fontes | SRC-001 |
| Evidências | EV-082, EV-069 |
| BRs | BR-016 |
| FRs | FR-042 |
| Atores | Responsável documental |
| Sinônimos | Substituir documento |
| Aliases | — |
| Termos confundidos | sobrescrever arquivo |
| Exemplos válidos | "Substituir versão vigente mantendo v1 arquivada" |
| Exemplos inválidos | "Substituir = apagar versão anterior" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-033 |

## TERM-044 — Histórico da OS

| Campo | Valor |
| --- | --- |
| Term ID | TERM-044 |
| Termo preferencial | Histórico da OS |
| Definição candidata | Sequência registrada de alterações e eventos relevantes da OS para auditoria. |
| Significado empresarial | Accountability e disputas (EV-078, EV-079). |
| Significado excluído | Não é log técnico de aplicação. |
| Contexto | AUDIT |
| Fontes | SRC-001 |
| Evidências | EV-078, EV-079 |
| BRs | BR-019 |
| FRs | FR-022 |
| Atores | Auditor; Operacional |
| Sinônimos | Histórico de alterações |
| Aliases | — |
| Termos confundidos | TECHNICAL_LOG |
| Exemplos válidos | "Consultar quem alterou itens da OS" |
| Exemplos inválidos | "Histórico = stdout do servidor" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-015 |

## TERM-045 — Conversão (solicitação → OS)

| Campo | Valor |
| --- | --- |
| Term ID | TERM-045 |
| Termo preferencial | Conversão (solicitação → OS) |
| Definição candidata | Ato de criar OS a partir de solicitação mediante decisão autorizada, sem duplicidade. |
| Significado empresarial | Ponte solicitação–OS (EV-028, EV-034). |
| Significado excluído | Não é automática para toda solicitação; não é liberação. |
| Contexto | SERVICE_REQUEST / SERVICE_ORDER |
| Fontes | SRC-001 |
| Evidências | EV-028, EV-034, EV-036 |
| BRs | BR-001 |
| FRs | FR-008, FR-009 |
| Atores | Autorizador empresarial |
| Sinônimos | Converter solicitação |
| Aliases | — |
| Termos confundidos | TERM-010 |
| Exemplos válidos | "Converter solicitação aprovada em rascunho de OS" |
| Exemplos inválidos | "Converter = liberar para execução" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-002 |

## TERM-046 — Decisão sobre solicitação

| Campo | Valor |
| --- | --- |
| Term ID | TERM-046 |
| Termo preferencial | Decisão sobre solicitação |
| Definição candidata | Aprovação, rejeição ou outro desfecho registrado sobre solicitação com motivo quando aplicável. |
| Significado empresarial | Gate antes de conversão (EV-030, EV-033). |
| Significado excluído | Não é comentário informal sem registro. |
| Contexto | SERVICE_REQUEST |
| Fontes | SRC-001 |
| Evidências | EV-030, EV-033 |
| BRs | BR-004 |
| FRs | FR-006, FR-007 |
| Atores | Autorizador empresarial |
| Sinônimos | Aprovação/rejeição (quando tipificados) |
| Aliases | — |
| Termos confundidos | TERM-010 |
| Exemplos válidos | "Rejeitar solicitação com motivo" |
| Exemplos inválidos | "Decisão implícita por silêncio" (TBD) |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-002 |

## TERM-047 — Decisão sobre medição

| Campo | Valor |
| --- | --- |
| Term ID | TERM-047 |
| Termo preferencial | Decisão sobre medição |
| Definição candidata | Aprovação ou rejeição de medição submetida, com segregação candidata de papéis. |
| Significado empresarial | Controle antes de faturamento (EV-062, EV-063). |
| Significado excluído | Não é preparação de medição pelo mesmo sentido. |
| Contexto | MEASUREMENT |
| Fontes | SRC-001 |
| Evidências | EV-062, EV-063 |
| BRs | BR-009 |
| FRs | FR-037 |
| Atores | Autorizador empresarial |
| Sinônimos | — |
| Aliases | — |
| Termos confundidos | TERM-016 (processo inteiro) |
| Exemplos válidos | "Aprovar medição para prosseguir faturamento candidato" |
| Exemplos inválidos | "Quem prepara medição aprova a própria" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-010 |

## TERM-048 — Identificador externo comercial

| Campo | Valor |
| --- | --- |
| Term ID | TERM-048 |
| Termo preferencial | Identificador externo comercial |
| Definição candidata | ID preservado de sistemas ou documentos externos (cliente, ERP, PO). |
| Significado empresarial | Integridade de referência (EV-059, EV-072). |
| Significado excluído | Não substitui identificador interno da OS/solicitação. |
| Contexto | COMMERCIAL |
| Fontes | SRC-001 |
| Evidências | EV-059, EV-072 |
| BRs | BR-008 |
| FRs | FR-030 |
| Atores | Comercial; Integração |
| Sinônimos | ID externo |
| Aliases | — |
| Termos confundidos | TERM-015 |
| Exemplos válidos | "Preservar número PO do cliente" |
| Exemplos inválidos | "Alterar ID externo silenciosamente" |
| Status | ACCEPTED_FOR_DOCUMENTATION |
| Confiança | MEDIUM |
| DDPs | DDP-020 |
