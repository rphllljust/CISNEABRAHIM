# Prompt 58 — Preparação de faturamento (backend)

## Escopo

Domínio operacional de **preparação de faturamento** (`bil.*`) derivado exclusivamente de medição **APPROVED**.

Não é ERP contábil: não emite nota fiscal, não registra envio ou pagamento.

## Modelo

| Conceito | Persistência |
|----------|--------------|
| BillingRecord | `bil.billing_records` |
| BillingItem | `bil.billing_items` (origem: `measurement_item_id`) |
| Histórico | `bil.billing_history_events` |
| Idempotência | `bil.billing_command_idempotency` |

Relacionamentos: Client, ServiceOrder, Measurement, Proposal/PO/Contract (referências), snapshots comerciais e cadastrais.

## Estados operacionais

| Status | Significado |
|--------|-------------|
| `PREPARED` | Preparação concluída (candidato a documento externo) |
| `VOIDED` | Preparação anulada operacionalmente |

Separado de: emitido fiscalmente, enviado, pago (fora deste prompt).

## Origem e valores

- Criação exige `measurement.status = APPROVED`
- Itens copiados da medição (`measured_quantity`, `line_amount`)
- `total_amount` = soma dos itens (`numeric(18,4)`), nunca digitado como origem
- `assertedTotalAmount` opcional apenas para validação cruzada → `BILLING_AMOUNT_MISMATCH`

## Snapshots (imutáveis após preparação)

- `client_legal_name_snapshot`
- `client_tax_id_snapshot`
- `billing_address_snapshot`
- `commercial_reference_snapshot` (da medição)

## Condições comerciais

`paymentTerms` declarado na preparação é confrontado com fonte autoritativa (PO live, snapshots de PO/proposta/contrato).

Divergência → `BILLING_COMMERCIAL_TERMS_MISMATCH` (sem decisão silenciosa).

## API

| Método | Rota |
|--------|------|
| `GET` | `/api/v1/service-orders/:id/billing-records` |
| `POST` | `/api/v1/service-orders/:id/billing-records` |
| `GET` | `.../billing-records/:billingRecordId` |
| `POST` | `.../billing-records/:billingRecordId/void` |

## Migração

`0024_billing_baseline.sql` — schema `bil`.

## Testes

```bash
cd apps/api
npx vitest run src/billing/domain/
npx vitest run --config vitest.integration.config.ts src/billing/billing.integration.spec.ts
npx vitest run --config vitest.e2e.config.ts src/billing/billing.e2e.spec.ts
npx tsc -b
npx eslint "src/billing/**/*.{ts,tsx}"
```

Cobertura: sem medição aprovada, duplicata, total divergente, mismatch de PO, precisão, autorização, concorrência, snapshot, void/rollback transacional, E2E.
