# DBND-EVT-OWN-001

| Campo | Valor |
| --- | --- |
| Document ID | Ownership de eventos por contexto |
| Prompt | 05 |

> Eventos = fatos ocorridos. Nomes EN em domain-event-candidates.md são candidatos técnicos.

| Evento candidato | BC publicador | Consumidores candidatos | Evidência |
| --- | --- | --- | --- |
| ServiceRequestReceived | BC-CAND-005 | BC-CAND-017, BC-CAND-015 | EV-027 |
| ServiceRequestDecided | BC-CAND-005 | BC-CAND-006, BC-CAND-017 | EV-038 |
| ServiceOrderCreated / DraftCreated | BC-CAND-006 | BC-CAND-007, BC-CAND-017 | EV-042 |
| ServiceOrderReleased | BC-CAND-006 | BC-CAND-008, BC-CAND-015, BC-CAND-017 | EV-039 |
| ResponsibilityAssigned | BC-CAND-006 | BC-CAND-015, BC-CAND-017 | EV-084 |
| ResourcePlanned | BC-CAND-007 | BC-CAND-006 | EV-049 |
| ResourceAllocated | BC-CAND-007 | BC-CAND-008, BC-CAND-017 | EV-051 |
| AllocationConflictDetected | BC-CAND-007 | BC-CAND-015, BC-CAND-016 | EV-053 |
| ExecutionStarted | BC-CAND-008 | BC-CAND-006, BC-CAND-017 | EV-044 |
| QuantityRecorded | BC-CAND-008 | BC-CAND-010 | EV-065 |
| ServiceOrderCompleted | BC-CAND-008 / BC-006 | BC-CAND-010, BC-CAND-017 | EV-045 |
| EvidenceAttached | BC-CAND-009 | BC-CAND-014, BC-CAND-017 | EV-067 |
| MeasurementSubmitted | BC-CAND-010 | BC-CAND-011, BC-CAND-017 | EV-062 |
| MeasurementDecided | BC-CAND-010 | BC-CAND-011, BC-CAND-017 | EV-063 |
| BillingPrepared | BC-CAND-011 | BC-CAND-012, BC-CAND-017 | EV-017 |
| InvoiceRecorded | BC-CAND-012 | BC-CAND-013, BC-CAND-017 | EV-064 |
| PaymentRecorded | BC-CAND-013 | BC-CAND-017 | EV-066 |
| DocumentVersionSuperseded | BC-CAND-014 | BC-CAND-017 | EV-082 |
| CommercialReferenceSynced | BC-CAND-018 | BC-CAND-003, BC-CAND-004 | EV-077 |
| DivergenceDetected | BC-CAND-003 | BC-CAND-016, BC-CAND-017 | EV-056 |

BC-CAND-017 consome eventos para AUDIT_TRAIL; não reescreve estado de negócio.

BC-CAND-016 pode consumir todos para projeções — **réplica**, não write owner.
