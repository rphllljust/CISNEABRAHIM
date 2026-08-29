# Candidatos a eventos de domínio

| Campo | Valor |
| --- | --- |
| Document ID | DEV-001 |

| Evento candidato | Classificação | Evidência | Notas |
| --- | --- | --- | --- |
| ServiceRequestReceived | DOMAIN_EVENT_CANDIDATE | EV-027 | Canal TBD |
| ServiceRequestRejected | DECISION_PENDING | EV-034 | DO_NOT_PROMOTE |
| ServiceOrderDraftCreated | DOMAIN_EVENT_CANDIDATE | EV-042 | |
| ServiceOrderReleased | DOMAIN_EVENT_CANDIDATE | EV-039, EV-040 | |
| ServiceOrderCancelled | NOT_SUPPORTED | SRC-001 §6 | DDP-004 |
| ServiceOrderReopened | NOT_SUPPORTED | SRC-001 §6 | DDP-005 |
| ResourcePlanned | DOMAIN_EVENT_CANDIDATE | EV-064 | Fase ITEM_PLANNED |
| ResourceAuthorized | DOMAIN_EVENT_CANDIDATE | EV-064 | |
| ResourceAllocated | DOMAIN_EVENT_CANDIDATE | EV-051 | |
| ResourceExecuted | DOMAIN_EVENT_CANDIDATE | EV-063 | |
| EvidenceAttached | DOMAIN_EVENT_CANDIDATE | EV-063 | |
| ItemMeasured | DOMAIN_EVENT_CANDIDATE | EV-073 | Processo TBD |
| ItemBilled | DOMAIN_EVENT_CANDIDATE | EV-074 | |
| PaymentRecorded | DOMAIN_EVENT_CANDIDATE | EV-074 | DDP-012 |
| DocumentVersionUploaded | DOMAIN_EVENT_CANDIDATE | EV-081 | |
| DocumentVersionSuperseded | DOMAIN_EVENT_CANDIDATE | EV-082 | Histórico preservado |
| ResponsibilityAssigned | CLASSIFICATION_PENDING | EV-084 | Pode ser evento ou estado |
| ResponsibilityDelivered | CLASSIFICATION_PENDING | EV-084 | |
| ItemViewed | CLASSIFICATION_PENDING | EV-084, EV-016 | |
| ItemAcknowledged | CLASSIFICATION_PENDING | EV-084 | |
| PurchaseOrderImported | INTEGRATION_EVENT_CANDIDATE | EV-060 | |
| AgingThresholdCrossed | DO_NOT_PROMOTE | EV-075, EV-076 | Sem faixas definidas |

## Eventos técnicos (não domínio)

Ver [non-domain-data.md](non-domain-data.md).
