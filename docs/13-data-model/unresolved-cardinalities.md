# DM-CARD-FK-001

| Campo       | Valor                                 |
| ----------- | ------------------------------------- |
| Document ID | Cardinalidades pendentes → impacto FK |
| Herda       | DM-CARD-001 (Prompt 11) — 12 CARD-DDP |
| Prompt      | 12                                    |

## Mapeamento CARD-DDP → modelo relacional

| CARD-DDP     | Relação                   | Impacto em TBL/FK/UNQ       | Se 1:1 fechar                      | Se 1:N fechar               |
| ------------ | ------------------------- | --------------------------- | ---------------------------------- | --------------------------- |
| CARD-DDP-001 | Item PO ↔ Item planejado  | Sem FK direta ainda         | FK planned_item → po_line          | Tabela associação N:M       |
| CARD-DDP-002 | Consumo PO                | po.consumption_entry shape  | Um evento por OS                   | Múltiplos consumption_entry |
| CARD-DDP-003 | OS ↔ ExecutionRecord      | exe.execution_record count  | UNQ service_order_id               | Múltiplos execution_record  |
| CARD-DDP-004 | OS ↔ Measurement          | msr.measurement cardinality | UNQ-CAND-006 estrito               | measurement por ciclo/item  |
| CARD-DDP-005 | Measurement ↔ BillingPrep | UNQ-CAND-015                | FK 1:1 measurement_id              | Vários prep por medição     |
| CARD-DDP-006 | BillingPrep ↔ Invoice     | inv FK opcional             | UNQ billing_preparation_id         | Várias notas parciais       |
| CARD-DDP-007 | Invoice ↔ Payment         | pay FK + UNQ-CAND-008       | Um pagamento total                 | Vários payment_registration |
| CARD-DDP-008 | SR ↔ OS                   | UNQ-CAND-002/004            | service_request_id NOT NULL UNIQUE | SR sem OS permitido         |
| CARD-DDP-009 | OS ↔ CommercialRef        | commercial_reference_id FK  | 1:1 por OS                         | N OS mesmo ref              |
| CARD-DDP-010 | OS ↔ ResourceAllocation   | 1:N assumido candidato      | —                                  | Confirmar EV-051            |
| CARD-DDP-011 | human_number OS           | UNQ-CAND-003 escopo         | UNIQUE global                      | UNIQUE (unit, number)       |
| CARD-DDP-012 | Evidence ↔ Document       | evd.evidence_link           | 1 doc por evidence                 | N evidences mesmo doc       |

## FK adiadas até decisão

| FK                                          | CARD-DDP |
| ------------------------------------------- | -------- |
| planned_item → purchase_order_line          | 001      |
| consumption_entry.service_order_id NOT NULL | 002      |
| UNQ execution_record(service_order_id)      | 003      |
| UNQ billing_preparation(measurement_id)     | 005      |

## Regra de modelagem

Enquanto CARD-DDP aberta:

1. FK nullable onde aplicável
2. UNQ correspondente marcada PENDING
3. ERD com relação `?`
4. Não documentar cardinalidade como CONFIRMED

## Prioridade (herdada Prompt 11)

CARD-DDP-001, 002, 007, 004 — bloqueiam constraints definitivas em PO, pagamento e medição.
