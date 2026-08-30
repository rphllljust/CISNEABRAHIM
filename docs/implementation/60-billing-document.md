# Prompt 60 — Nota Fatura digital (BillingDocument)

## Escopo

Documento interno **NOTA FATURA** (não NF-e/NFS-e) gerado a partir de `BillingRecord` **PREPARED**.

`BillingDocument` ≠ documento fiscal oficial.

## Modelo

| Conceito | Persistência |
|----------|--------------|
| BillingDocument | `bil.billing_documents` |
| BillingDocumentItem | `bil.billing_document_items` |
| Numeração | `bil.billing_document_number_sequences` (transacional `FOR UPDATE`) |
| Histórico | `bil.billing_document_history_events` |
| Idempotência | `bil.billing_document_command_idempotency` |
| Artefato PDF | `doc.documents` + `doc.stored_objects` (`category_code = BILLING_DOCUMENT`) |

Relacionamentos: BillingRecord, Client, Measurement, OS, CommercialReference (PO/RC/contrato).

## Numeração

Formato: `NF-{ANO}-{SEQUENCIA_6}` (ex.: `NF-2026-000001`).

Alocação em transação com `INSERT ... ON CONFLICT` + `SELECT ... FOR UPDATE` + `UPDATE ... RETURNING` — sem `SELECT MAX+1` desprotegido.

## Snapshots (imutáveis após emissão)

Emitente CISNE, cliente, CNPJ, endereço, itens, quantidades, UoM, preços, total, condição de pagamento, vencimento, PO/RC/referência comercial.

## PDF

Geração server-side determinística (`pdfkit`), A4, layout fixo, valores `pt-BR`, disclaimer fiscal explícito.

Hash SHA-256 do artefato persistido em `artifact_sha256`.

## Imutabilidade

`FINALIZED` não é sobrescrito. Correção via **cancelamento** ou **substituição** (`replace`) com nova versão e `replaces_document_id`.

## API

| Método | Rota |
|--------|------|
| `GET` | `/api/v1/service-orders/:id/billing-records/:billingRecordId/documents` |
| `POST` | `.../documents` (emitir) |
| `GET` | `.../documents/:billingDocumentId` |
| `GET` | `.../documents/:billingDocumentId/pdf` |
| `POST` | `.../documents/:billingDocumentId/cancel` |
| `POST` | `.../documents/:billingDocumentId/replace` |

## Authz

- `billing:billing-document:issue|read|cancel|replace|download`

## Migração

`0025_billing_documents.sql` — schema `bil`.

## Testes

```bash
cd apps/api
npx vitest run src/billing/domain/
npx vitest run --config vitest.integration.config.ts src/billing/billing-document.integration.spec.ts
npx vitest run --config vitest.e2e.config.ts src/billing/billing-document.e2e.spec.ts
```

Cobertura: numeração concorrente, snapshots, valores, PO, PDF determinístico, imutabilidade/substituição, autorização, falha de storage, E2E.
