# DBEH-INT-EVT-001

| Campo | Valor |
| --- | --- |
| Document ID | Candidatos a evento de integração |
| Prompt | 06 |

| ID | Evento | Origem | Consumidor interno | SoT | Status |
| --- | --- | --- | --- | --- | --- |
| IE-001 | Referência comercial recebida | ERP | BC-003 | Externo | CANDIDATE |
| IE-002 | PO importada | Cliente/ERP | BC-004 | Externo | CANDIDATE |
| IE-003 | Nota fiscal emitida externamente | Fiscal | BC-012 | Externo | CANDIDATE |
| IE-004 | Pagamento confirmado externamente | Banco/ERP | BC-013 | Externo | PENDING |
| IE-005 | Mensagem WhatsApp recebida | Canal | BC-005 | Canal | CAPABILITY_ONLY |
| IE-006 | Sincronização falhou | Adaptador | BC-018 | — | CANDIDATE |

DE-020 mapeia IE-001 após tradução ACL.

Integration events **não** substituem DE internos — BC-018 traduz e publica DE/estado interno conforme INV-016.

Retry/idempotência: IDEM-REQ-004; sem outbox escolhido.
