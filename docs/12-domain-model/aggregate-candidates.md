# DM-AGG-001

| Campo | Valor |
| --- | --- |
| Document ID | Aggregates candidatos |
| Total | 14 (AGG-CAND-001..014) |
| Prompt | 11 |

---

## AGG-CAND-001 — ServiceRequest

| Campo | Valor |
| --- | --- |
| Propósito | Capturar e decidir solicitação antes da OS |
| Root | ENTITY-CAND-001 SolicitaçãoDeServiço |
| Membros | Metadados intake (VO); decisão (atributo/VO) |
| Invariantes | INV-001, INV-003 |
| Comandos | CMD-001, CMD-002 |
| Eventos | DE-001, DE-002 |
| Ciclo de vida | SM-CAND-001 |
| Boundary | STRONG_WITHIN_BOUNDARY |
| Refs externas | PartyId (REF); canal intake |
| Concorrência | DEDUPLICATION |
| Volume | Médio |
| Evidências | EV-027, TERM-001 |
| Status | **ACCEPTED_FOR_LOGICAL_MODELING** |

---

## AGG-CAND-002 — ServiceOrder

| Campo | Valor |
| --- | --- |
| Propósito | Ciclo de vida operacional da OS |
| Root | ENTITY-CAND-002 OrdemDeServiço |
| Membros | ENTITY-CAND-003 ItemPlanejadoOS; ENTITY-CAND-022 ResponsabilidadeOS? |
| Invariantes | INV-002, INV-015, INV-019, INV-020 |
| Comandos | CMD-003..007, CMD-010..013 |
| Eventos | DE-003..006, DE-011, DE-012 |
| Ciclo de vida | SM-CAND-002 |
| Boundary | STRONG_WITHIN_BOUNDARY; CMD-003 transacional com AGG-001 |
| Refs externas | ServiceRequestId; CommercialReferenceId; PurchaseOrderId? |
| Concorrência | OPTIMISTIC (INV-019) |
| Volume | Alto |
| Riscos | DM-RISK-001 OS inchada |
| Status | **ACCEPTED_FOR_LOGICAL_MODELING** |

**Rejeitado:** fundir medição/faturamento no root.

---

## AGG-CAND-003 — ResourceAllocation

| Campo | Valor |
| --- | --- |
| Propósito | Vínculo recurso↔planejamento OS |
| Root | ENTITY-CAND-005 AlocaçãoRecurso |
| Membros | — (aggregate pequeno) |
| Invariantes | INV-004 |
| Comandos | CMD-014, CMD-015 |
| Eventos | DE-007, DE-008 |
| Ciclo de vida | SM-CAND-003 |
| Refs externas | ServiceOrderId; ItemPlanejadoId; ResourceId |
| Concorrência | EXCLUSIVE_RESOURCE |
| Status | CANDIDATE |

Planejamento permanece em AGG-002; alocação **separada** (EP-011).

---

## AGG-CAND-004 — ExecutionRecord

| Campo | Valor |
| --- | --- |
| Propósito | Progresso operacional real em campo |
| Root | ENTITY-CAND-006 RegistroExecução |
| Membros | ENTITY-CAND-007 RegistroProgressoExecução |
| Invariantes | INV-020, INV-021 |
| Comandos | CMD-008, CMD-009 |
| Eventos | DE-009, DE-010 |
| Ciclo de vida | SM-CAND-004 |
| Refs externas | ServiceOrderId |
| Status | CANDIDATE |

---

## AGG-CAND-005 — EvidenceLink

| Campo | Valor |
| --- | --- |
| Propósito | Vincular evidência de execução a documento |
| Root | ENTITY-CAND-008 VínculoEvidênciaExecução |
| Invariantes | — |
| Comandos | CMD-016 |
| Eventos | DE-013 |
| Refs externas | ExecutionRecordId; DocumentId (AGG-013) |
| Status | CANDIDATE |

Arquivo binário **não** neste aggregate — AGG-013.

---

## AGG-CAND-006 — Measurement

| Campo | Valor |
| --- | --- |
| Propósito | Medição formal pós-execução |
| Root | ENTITY-CAND-009 Medição |
| Membros | ENTITY-CAND-010 LinhaMedição |
| Invariantes | INV-008, INV-009, INV-017 |
| Comandos | CMD-017, CMD-018 |
| Eventos | DE-014, DE-015 |
| Ciclo de vida | SM-CAND-005 |
| Refs externas | ServiceOrderId; ExecutionRecordId? |
| Status | **ACCEPTED_FOR_LOGICAL_MODELING** |

---

## AGG-CAND-007 — BillingPreparation

| Campo | Valor |
| --- | --- |
| Propósito | Consolidar itens faturáveis |
| Root | ENTITY-CAND-011 PreparaçãoFaturamento |
| Membros | ENTITY-CAND-012 ItemFaturável |
| Invariantes | INV-007 |
| Comandos | CMD-019 |
| Eventos | DE-016 |
| Ciclo de vida | SM-CAND-007 |
| Refs externas | MeasurementId |
| Status | CANDIDATE |

---

## AGG-CAND-008 — InformedInvoice

| Campo | Valor |
| --- | --- |
| Propósito | Registrar nota/fatura informada |
| Root | ENTITY-CAND-013 DocumentoFaturamentoInformado |
| Invariantes | INV-011, INV-018 |
| Comandos | CMD-020 |
| Eventos | DE-017 |
| Ciclo de vida | SM-CAND-008 |
| Refs externas | BillingPreparationId; valores MoneyAmount |
| Status | CANDIDATE |

---

## AGG-CAND-009 — PaymentRegistration

| Campo | Valor |
| --- | --- |
| Propósito | Registrar pagamento recebido |
| Root | ENTITY-CAND-014 RegistroPagamento |
| Invariantes | INV-010 |
| Comandos | CMD-021 |
| Eventos | DE-018 |
| Ciclo de vida | SM-CAND-009 |
| Refs externas | InformedInvoiceId; EXT-REC banco? |
| SoT | DDP-012 — pode ser EXTERNAL_RECORD |
| Status | PENDING_BUSINESS_DECISION |

---

## AGG-CAND-010 — PurchaseOrder

| Campo | Valor |
| --- | --- |
| Propósito | PO e saldo/consumo |
| Root | ENTITY-CAND-017 PedidoCompra |
| Membros | ENTITY-CAND-018 ItemPO; ENTITY-CAND-023 ConsumoPO? |
| Invariantes | INV-012 |
| Refs externas | EXT-REC ERP |
| Status | PENDING_BUSINESS_DECISION |

---

## AGG-CAND-011 — CommercialReference

| Campo | Valor |
| --- | --- |
| Propósito | Proposta/preço/referência comercial |
| Root | ENTITY-CAND-019 ReferênciaComercial |
| Invariantes | INV-005, INV-006, INV-022 |
| Refs externas | PartyId; sync BC-018 |
| Status | CANDIDATE |

---

## AGG-CAND-012 — Party

| Campo | Valor |
| --- | --- |
| Propósito | Cliente/party mínimo |
| Root | ENTITY-CAND-020 PartyCliente |
| Status | CANDIDATE |

---

## AGG-CAND-013 — LogicalDocument

| Campo | Valor |
| --- | --- |
| Propósito | Documento lógico e versões |
| Root | ENTITY-CAND-015 DocumentoLógico |
| Membros | ENTITY-CAND-016 VersãoDocumental (+ VO FileDescriptor) |
| Invariantes | INV-013 |
| Comandos | CMD-022 |
| Eventos | DE-019 |
| Ciclo de vida | SM-CAND-006 |
| Status | **ACCEPTED_FOR_LOGICAL_MODELING** |

---

## AGG-CAND-014 — NotificationDelivery

| Campo | Valor |
| --- | --- |
| Propósito | Entrega notificação canal |
| Root | ENTITY-CAND-021 EntregaNotificação |
| Ciclo de vida | SM-CAND-010 |
| Refs externas | ServiceOrderId? |
| Status | CANDIDATE |

---

## Aggregates rejeitados

| Nome rejeitado | Motivo |
| --- | --- |
| UnifiedOperationsAggregate | Viola separação SM |
| ServiceRequestOrder | EP-015 |
| FinancialMegaAggregate | SoD e ciclos |
