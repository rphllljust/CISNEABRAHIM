# DBND-BC-001

| Campo | Valor |
| --- | --- |
| Document ID | Bounded contexts candidatos |
| Fonte | SRC-001 |
| Total | 18 (BC-CAND-001..BC-CAND-018) |
| Prompt | 05 |

> **SOLUTION_SPACE** — candidatos para modelagem futura. Não são serviços.

## Índice

| ID | Nome candidato | SUBD | Status | Confiança |
| --- | --- | --- | --- | --- |
| BC-CAND-001 | Identity & Access | SUBD-008 | CANDIDATE | LOW |
| BC-CAND-002 | Party & Client | SUBD-005 | CANDIDATE | LOW |
| BC-CAND-003 | Commercial Reference | SUBD-005 | CANDIDATE | MEDIUM |
| BC-CAND-004 | Purchase Order | SUBD-005 | PENDING_BUSINESS_VALIDATION | MEDIUM |
| BC-CAND-005 | Service Request | SUBD-001 | ACCEPTED_FOR_FURTHER_MODELING | MEDIUM |
| BC-CAND-006 | Service Order Lifecycle | SUBD-002 | ACCEPTED_FOR_FURTHER_MODELING | MEDIUM |
| BC-CAND-007 | Resource Management | SUBD-003 | CANDIDATE | MEDIUM |
| BC-CAND-008 | Field Execution | SUBD-004 | CANDIDATE | MEDIUM |
| BC-CAND-009 | Evidence Capture | SUBD-004 | CANDIDATE | MEDIUM |
| BC-CAND-010 | Measurement | SUBD-006 | PENDING_BUSINESS_VALIDATION | LOW |
| BC-CAND-011 | Billing Preparation | SUBD-006 | CANDIDATE | MEDIUM |
| BC-CAND-012 | Invoice & Receivables | SUBD-006 | PENDING_BUSINESS_VALIDATION | LOW |
| BC-CAND-013 | Payment Tracking | SUBD-006 | PENDING_BUSINESS_VALIDATION | LOW |
| BC-CAND-014 | Document Management | SUBD-007 | CANDIDATE | MEDIUM |
| BC-CAND-015 | Notification | SUBD-011 | CANDIDATE | LOW |
| BC-CAND-016 | Reporting & Analytics | SUBD-010 | CANDIDATE | LOW |
| BC-CAND-017 | Audit & Domain History | SUBD-008 | CANDIDATE | MEDIUM |
| BC-CAND-018 | Integration Gateway | SUBD-009 | PENDING_ARCHITECTURE_DECISION | LOW |

---

## BC-CAND-005 — Service Request (detalhe representativo)

| Campo | Valor |
| --- | --- |
| Propósito | Registrar, consultar e decidir solicitações de serviço antes da OS |
| Linguagem | TERM-001, TERM-005, TERM-035, TERM-046 |
| Capacidades | CAP-007 |
| Regras possuídas | BR-001, BR-004, BR-005 (candidatas) |
| Comandos possuídos | Registrar solicitação; Decidir solicitação (candidatos) |
| Eventos possuídos | ServiceRequestReceived; ServiceRequestDecided (candidatos) |
| Dados autoritativos | Identificador solicitação; estado decisão; metadados intake |
| Dados referenciados | Cliente (BC-002); canal (WhatsApp) |
| Invariantes | Não duplicar solicitação equivalente (NFR-002); ≠ OS |
| Atores | Solicitante; Autorizador empresarial |
| Entradas | Formulário, WhatsApp, importação futura |
| Saídas | Evento para conversão OS; referência em auditoria |
| Dependências | BC-002, BC-001, BC-017 |
| Consistência | STRONG_WITHIN_BOUNDARY (NFR-002) |
| Riscos acoplamento | Duplicidade com OS se fronteira fraca (RISK-004) |
| DDPs | DDP-002, DDP-021, DDP-028 |
| Confiança | MEDIUM |
| Status | ACCEPTED_FOR_FURTHER_MODELING |

## BC-CAND-006 — Service Order Lifecycle (detalhe representativo)

| Campo | Valor |
| --- | --- |
| Propósito | Ciclo de vida da OS: criação, preparação, liberação, conclusão, cancelamento, reabertura |
| Linguagem | TERM-002, TERM-009, TERM-010, TERM-044, TERM-045 |
| Capacidades | CAP-008, CAP-022 |
| Regras possuídas | BR-006, BR-007, BR-019, BR-025 |
| Comandos possuídos | Converter; Preparar; Liberar; Cancelar; Reabrir; Atribuir responsável |
| Eventos possuídos | ServiceOrderDraftCreated; ServiceOrderReleased; ResponsibilityAssigned (ambiguidades DDP-032) |
| Dados autoritativos | OS; estado ciclo; histórico OS; responsável |
| Dados referenciados | Solicitação origem; recursos planejados; referências comerciais |
| Invariantes | Liberação exige elegibilidade (NFR-004); uma OS por solicitação (NFR-003) |
| Atores | Operacional; Autorizador; Responsável |
| Entradas | Conversão; alterações; decisões liberação |
| Saídas | OS liberada para execução; eventos para medição/recursos |
| Dependências | BC-005, BC-003, BC-004, BC-007, BC-017 |
| Consistência | STRONG_WITHIN_BOUNDARY / TRANSACTIONAL em conversão |
| Riscos acoplamento | OS inchada absorvendo execução/medição (DBND-003) |
| DDPs | DDP-001, DDP-003, DDP-004, DDP-005, DDP-022, DDP-032 |
| Confiança | MEDIUM |
| Status | ACCEPTED_FOR_FURTHER_MODELING |

## Contextos rejeitados ou fundidos (justificativa)

| Candidato avaliado | Decisão | Motivo |
| --- | --- | --- |
| Service Order Planning separado de Service Order | **Fundir em BC-006 por ora** | Planejamento de conteúdo OS (FR-011) sem evidência de ciclo independente — DBND-001 |
| Equipment / Vehicle / Labor como 3 BCs | **Fundir em BC-007** | Mesma linguagem de alocação (TERM-029); separar só se taxonomia fechar (DDP-006, DDP-007) |
| Evidence dentro de Execution | **Separar BC-008 e BC-009** | Evidência tem ciclo documental e retenção distintos (TERM-034 vs TERM-031) |
| Audit dentro de cada BC | **BC-017 transversal** | DOMAIN_HISTORY vs AUDIT_TRAIL (NFR-006, NFR-029) — consumer de eventos |

Demais contextos seguem o mesmo modelo de campos no índice; detalhamento completo por BC disponível nas matrizes de ownership.

## BC-CAND-001..004, 007..018 — resumo one-liner

| ID | Write owner principal | SoT candidato |
| --- | --- | --- |
| 001 | Identidade ator, permissões empresariais candidatas | Interno futuro |
| 002 | Cadastro cliente/party mínimo | Interno / ERP TBD |
| 003 | Referência comercial, preço/custo na OS | Misto — ERP candidato |
| 004 | Saldo e consumo PO quando aplicável | Externo ou interno — DDP-009 |
| 007 | Catálogo recurso, alocação, conflito | Interno |
| 008 | Progresso execução, quantidades realizadas | Interno |
| 009 | Evidência de execução (metadados) | Interno; arquivo em BC-014 |
| 010 | Medição submetida/aprovada | Interno — entidade TBD |
| 011 | Preparação faturamento, origem itens | Interno |
| 012 | Registro nota/documento informado | Misto — fiscal externo |
| 013 | Registro pagamento | **Externo candidato** — DDP-012 |
| 014 | Documento lógico, versão, arquivo | Interno |
| 015 | Preferências e entrega notificação | Interno |
| 016 | Projeções leitura | Réplica / CQRS candidato |
| 017 | AUDIT_TRAIL, DOMAIN_HISTORY | Interno append-only |
| 018 | Adaptação protocolos externos | Não owner de negócio |
