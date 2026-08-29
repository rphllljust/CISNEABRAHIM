# Prompt 47 — Purchase orders e autorizações comerciais

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(commercial): implement purchase orders and authorizations` |
| **Próximo passo autorizado** | Prompt 48 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| PurchaseOrder ≠ ServiceRequest / ServiceOrder | **SIM** — agregado `com.purchase_orders` próprio |
| PurchaseOrderItem | **SIM** |
| Abstração CommercialAuthorization genérica | **NÃO** — regras em `purchase_order_billing_rules` por PO |
| Campos contratuais (PO, RC, locais, pagamento, itens) | **SIM** |
| Regras por PO (não globais) | **SIM** — enum dedicado + `rule_config` |
| Precedência PO > Contract > Client > System | **PREPARADO** — `precedence_tier`; sem resolver |
| Snapshot na registração | **SIM** — `client_snapshot` + `service_snapshot` |
| Precisão monetária | **SIM** — numeric(18,4) + validação de linha |
| Prompt 48 executado | **NÃO** |

## Schema (`0017_commercial_purchase_orders_baseline.sql`)

| Objeto | Descrição |
| ------ | --------- |
| `com.purchase_orders` | Cabeçalho recebido do cliente |
| `com.purchase_order_items` | Itens (quantidade, UoM, preço, total) |
| `com.purchase_order_billing_rules` | Regras de faturamento vinculadas ao PO |
| `com.purchase_order_document_links` | Documento original e anexos |

### Regras por PO (`purchase_order_rule_type`)

- `PO_NUMBER_REQUIRED_ON_INVOICE`
- `XML_REQUIRED`
- `PDF_REQUIRED`
- `BILLING_CUTOFF` (`rule_config.cutoffDay`)
- `RECIPIENT` (`rule_config.recipient`)

## API (`/api/v1/commercial/purchase-orders`)

| Método | Path | Ação |
| ------ | ---- | ---- |
| POST | `/` | Criar rascunho |
| GET | `/` | Listar (escopo UNIT/CLIENT/GLOBAL) |
| GET | `/:id` | Detalhe |
| PATCH | `/:id` | Atualizar rascunho |
| POST | `/:id/register` | Registrar com snapshot |
| POST | `/:id/cancel` | Cancelar |
| POST | `/:id/documents` | Vincular documento |

## Cenário de teste (fixture)

RC `991487`, PO `41926266`, locação 1 UA R$ 9.351, `07 DDL`, `transferência` — somente em testes.

## Quality gate

- [x] lint, typecheck, test, test:integration (purchase-orders), test:e2e (purchase-orders) — PASS
- [x] `@cisne/database` build — PASS
- [x] Prompt 48 não executado
