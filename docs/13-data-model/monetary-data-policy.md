# DM-MONEY-001

| Campo | Valor |
| --- | --- |
| Document ID | Política de dados monetários |
| Herda | DM-MON-001 (Prompt 11) |
| Prompt | 12 |

## Representação candidata (PostgreSQL)

| Aspecto | Decisão candidata |
| --- | --- |
| Tipo | `numeric(19, 4)` — sem float |
| Moeda | Coluna `currency_code char(3)` ISO 4217 adjacente |
| Sinal | Valores não negativos em CHK-CAND; estornos = linha separada ou amount negativo? **PENDING** |
| Arredondamento | Half-up na aplicação; DB armazena valor já arredondado |
| Conversão cambial | Fora de escopo FOUNDATION — single currency por linha |

## Tabelas com colunas monetárias

| Tabela | Colunas |
| --- | --- |
| so.planned_item | unit_price_amount, unit_price_currency |
| bill.billable_item | amount, currency_code |
| inv.informed_invoice | total_amount, currency_code |
| pay.payment_registration | amount, currency_code |
| po.purchase_order | balance_amount, currency_code |
| po.purchase_order_line | authorized_amount, currency_code |
| po.consumption_entry | consumed_amount (+ currency TBD) |
| com.commercial_reference | cost_amount, price_amount, currency_code |

## Invariantes mapeadas

| INV | Constraint candidata |
| --- | --- |
| INV-005 | cost ≠ price conceitualmente — não CHECK automático |
| INV-006 | cost_amount RESTRICTED — mascaramento app/authz |
| INV-007 | billable_item amount + origin_ref |
| INV-011 | external_invoice_key UNQ + total_amount |
| INV-012 | balance >= 0 CHK-CAND-007 |

## O que não modelar nesta fase

- Tabela de câmbio
- Centavos como integer (alternativa válida — MDDP futuro)
- Impostos discriminados — aguarda fonte fiscal

## Sensibilidade

Classificação **FINANCIAL** ou **RESTRICTED** (custo/margem). Sem coluna `margin` calculada persistida salvo snapshot explícito em commercial_reference.
