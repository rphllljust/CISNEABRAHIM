# QA-PERF-001

| Campo       | Valor                           |
| ----------- | ------------------------------- |
| Document ID | Plano testes performance        |
| Status      | **ACTIVE** — BASELINE_ESTABLISHED |
| Prompt      | 82                              |

## Dataset sintético

Massa gerada por `apps/api/src/performance/synthetic/performance-dataset.seeder.ts` — sem dados pessoais de produção.

| Perfil | Clients | OS | ExecutionEntries | Documents | Measurements | Billing |
| ------ | ------- | -- | ---------------- | --------- | ------------ | ------- |
| smoke (CI) | 25 | 60 | 120 | 40 | 20 | 10 |
| full (`PERF_FULL=1`) | 500 | 2_000 | 5_000 | 800 | 400 | 200 |

Config: `PERF_DATASET_PROFILE=smoke|full`, `PERF_UNIT_ID`.

## Cenários de benchmark

Reproduzíveis via `apps/api/src/performance/benchmark/performance-scenarios.ts`:

| Cenário | Endpoint |
| ------- | -------- |
| auth.session | `GET /auth/session` |
| clients.list | `GET /clients` |
| search.advanced | `GET /search` |
| service-orders.list | `GET /service-orders` |
| dashboard.operational | `GET /dashboard/operational` |
| service-orders.detail | `GET /service-orders/:id` |
| resources.availability | `GET /resources/physical-assets?allocationStatus=AVAILABLE` |
| measurements.list | `GET /service-orders/:id/measurements` |
| billing.list | `GET /service-orders/:id/billing-records` |
| reports.catalog / preview | `GET /reports/*` |

Métricas: throughput, p50/p95/p99, error rate, heap/RSS, pool DB (quando coletado).

## Execução

| Comando | Uso |
| ------- | --- |
| `pnpm test:perf:smoke` | CI — smoke com dataset reduzido |
| `PERF_FULL=1 pnpm test:perf` | benchmark completo (não em cada PR) |

Ambiente: `TEST_DATABASE_URL` (descartável). Nunca produção.

## Budgets preliminares

Derivados de medição + headroom 2.5× (`performance-budgets.ts`). Não são SLAs empresariais confirmados — `PENDING_MEASUREMENT` em QATTR-PERF-001 permanece até validação com patrocinador.

## Correções aplicadas (Prompt 82)

1. **Search**: queries paralelas por tipo de entidade; correção de parâmetros SQL `42P18` em busca textual.
2. **Índice**: `service_orders_unit_status_created_idx` para listagens por unidade/status.

## Concorrência

`performance-concurrency.perf.spec.ts` — stress CNPJ duplicado com verificação de integridade (1 vencedor).

## Gate

- Smoke perf pode entrar em CI (`test:perf:smoke`).
- Load test completo não bloqueia cada PR (custo desproporcional).
