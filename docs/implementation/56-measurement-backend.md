# Prompt 56 — Medição (backend)

## Escopo

Agregado **Measurement** rastreável, derivado de ACTUAL (execution entries) + ajustes formalmente autorizados.

**Medição ≠ cópia editável da OS.**

## Modelo

| Conceito | Persistência |
|----------|--------------|
| Measurement | `msr.measurements` |
| MeasurementItem | `msr.measurement_items` (`source_execution_entry_id`) |
| Adjustment | `msr.measurement_adjustments` (divergência autorizada) |
| Business history | `msr.measurement_history_events` |
| Idempotência | `msr.measurement_command_idempotency` |

## Estados

`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` | `REJECTED`

Sem boolean `approved`.

## Origem e quantidades

- Itens gerados a partir de `so.execution_entries` (tipo `QUANTITY`)
- `actual_quantity` snapshot do ACTUAL; `measured_quantity` editável em DRAFT
- Divergência (`measured > actual`) exige `measurement_adjustments` autorizado
- Quantidades: `numeric(18,6)`; validação de escala via UoM do catálogo
- Unidade validada contra snapshot da OS (`allowedUnits`)

## Preço

`commercial_reference_snapshot` capturado na **criação** da medição (pricing models do snapshot de catálogo/OS).

Approve não consulta preço atual do catálogo.

## API

| Método | Rota |
|--------|------|
| `GET` | `/api/v1/service-orders/:id/measurements` |
| `POST` | `/api/v1/service-orders/:id/measurements` |
| `GET` | `.../measurements/:measurementId` |
| `POST` | `.../measurements/:measurementId/regenerate` |
| `PATCH` | `.../measurements/:measurementId/items/:itemId` |
| `POST` | `.../measurements/:measurementId/adjustments` |
| `POST` | `.../measurements/:measurementId/submit` |
| `POST` | `.../measurements/:measurementId/start-review` |
| `POST` | `.../measurements/:measurementId/approve` |
| `POST` | `.../measurements/:measurementId/reject` |

## Approve

Valida atomically: authorization, state, items, commercial reference, SoD (submitter ≠ approver), `expectedVersion`.

## Migração

`0023_measurement_baseline.sql` — schema `msr`.

## Testes

```bash
cd apps/api
npx vitest run src/measurements/domain/
npx vitest run --config vitest.integration.config.ts src/measurements/measurements.integration.spec.ts
npx vitest run --config vitest.e2e.config.ts src/measurements/measurements.e2e.spec.ts
npx tsc -b
npx eslint "src/measurements/**/*.{ts,tsx}"
```
