# DM-CARD-001

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | Cardinalidades pendentes |
| Total       | 12 (CARD-DDP-001..012)   |
| Prompt      | 11                       |

| ID           | Relação                     | Opções                       | Fonte            | Impacto     |
| ------------ | --------------------------- | ---------------------------- | ---------------- | ----------- |
| CARD-DDP-001 | Item PO ↔ Item planejado OS | 1:1, 1:N, N:M, nenhum        | DDP-009          | INV-012     |
| CARD-DDP-002 | Consumo PO por OS/medição   | Evento vs entidade ConsumoPO | DDP-009          | Saldo PO    |
| CARD-DDP-003 | OS ↔ ExecutionRecord        | 1:1 vs 1:N                   | DBND-003         | AGG-004     |
| CARD-DDP-004 | OS ↔ Measurement            | 1:1 vs 1:N por item          | DDP-010          | AGG-006     |
| CARD-DDP-005 | Measurement ↔ BillingPrep   | 1:1 vs 1:N                   | DDP-011          | AGG-007     |
| CARD-DDP-006 | BillingPrep ↔ Invoice       | 1:1 vs 1:N notas             | DDP-023          | AGG-008     |
| CARD-DDP-007 | Invoice ↔ Payment           | 1:1 vs 1:N parcial           | DDP-012, SDD-004 | AGG-009     |
| CARD-DDP-008 | ServiceRequest ↔ OS         | 1:1 vs 1:0..1                | INV-001          | Conversão   |
| CARD-DDP-009 | OS ↔ CommercialRef          | 1:1 vs N:1                   | TERM-015         | Preço       |
| CARD-DDP-010 | OS ↔ ResourceAllocation     | 1:N confirmado?              | EV-051           | Alocação    |
| CARD-DDP-011 | Número humano OS            | Único global vs por unidade  | —                | ID strategy |
| CARD-DDP-012 | Evidence ↔ Document         | 1:1 vs N:1 versão            | DDP-013          | AGG-005/013 |

## Regra

Ausência de fonte → **não** assumir 1:1 por conveniência de UI.

## Prioridade fechamento

CARD-DDP-001, 002 (PO), 007 (pagamento), 004 (medição).
