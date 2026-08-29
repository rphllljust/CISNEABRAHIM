# Prompt 39 — Modelos comerciais, precificação e medição

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(commercial): implement pricing and measurement models` |
| **Próximo passo autorizado** | Prompt 40 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Vocabulário comercial de precificação | **SIM** — `GLOBAL_PRICE`, `UNIT_PRICE`, `HOURLY`, `DAILY`, `MONTHLY`, `PER_TRIP`, `PER_KM`, `PER_M3`, `NEGOTIATED_PO_PRICE` mapeados para enum SQL existente |
| Vocabulário de medição | **SIM** — `measurement_basis`: UNIT, TIME, DISTANCE, VOLUME, WEIGHT, TRIP, GLOBAL_COMPLETION |
| Moeda | **SIM** — `numeric(18,4)`; API rejeita `float`/`double` em valores monetários |
| `internalCost` ≠ `salePrice` | **SIM** — campos independentes; sem margem/custo para empregado |
| Tributação (ICMS/ISS/NCM/CFOP) | **NÃO** |
| Agregado Measurement | **NÃO** — apenas policies/vocabulário |
| Prompt 40 executado | **NÃO** |

## Mapeamento comercial → persistência

| Código comercial (API) | `pricing_model_code` (SQL) | Unidade típica |
| ---------------------- | -------------------------- | -------------- |
| `GLOBAL_PRICE` | `FIXED` | — |
| `UNIT_PRICE` | `PER_UNIT` | configurável |
| `HOURLY` / `DAILY` / `MONTHLY` | `PER_PERIOD` | HOUR / DAY / MONTH |
| `PER_TRIP` | `PER_TRIP` | TRIP |
| `PER_KM` / `PER_M3` | `PER_UNIT` | KM / M3 |
| `NEGOTIATED_PO_PRICE` | `CONTRACT_REFERENCE` | UA (exemplo PO) |

## Migration `0012_commercial_pricing_measurement.sql`

- `cat.measurement_basis` em `service_definition_versions`
- `sale_price_amount`, `internal_cost_amount`, `currency_code` em `service_pricing_models`
- Trigger de imutabilidade atualizado para `measurement_basis`

## API

| Método | Rota | Capability |
| ------ | ---- | ---------- |
| GET | `/api/v1/commercial/pricing-models` | `commercial:policy:read` |
| GET | `/api/v1/commercial/measurement-models` | `commercial:policy:read` |

Service catalog (`POST/PATCH` definições) aceita `measurementBasis` e `pricingModels[]`.

## Exemplos de negócio suportados

1. **Obra global** — `GLOBAL_PRICE` R$ 96.000 (`salePrice`) com `internalCost` distinto; não exige soma de recursos internos.
2. **PO negociado** — `NEGOTIATED_PO_PRICE` 1 UA @ R$ 9.351 por ordem de compra.

## Quality gate

- [x] decimal precision
- [x] modelos válidos
- [x] incompatibilidade UoM
- [x] global price
- [x] unit price / PO price
- [x] invalid combination
- [x] authorization
- [x] versioning (cópia de `pricingModels` em nova versão)
- [x] lint, typecheck, test, test:integration, test:e2e, gate:database — PASS
