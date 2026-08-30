# Prompt 54 — Execução operacional e evidências (backend)

## Escopo

Núcleo transacional da execução operacional da OS, preservando separação:

**PLANNED ≠ ALLOCATED ≠ ACTUAL ≠ MEASURED**

Planejamento (`planned_resources` / `resource_allocations`) nunca é sobrescrito por registros de execução.

## Modelo

| Conceito | Persistência |
|----------|--------------|
| Execution (estado) | `so.service_orders` (`status`, `started_at/by`, `paused_at/by`, `completed_at/by`) |
| ExecutionEntry | `so.execution_entries` (quantidade, hodômetro, horímetro, observação) |
| ExecutionEvidence | `so.execution_evidence` (PHOTO, DOCUMENT, SIGNATURE, etc.) |
| ExecutionOccurrence | `so.execution_occurrences` |
| Business history | `so.service_order_history_events` + `so.execution_entry_history_events` |
| Idempotência | `so.execution_command_idempotency` |

## Comandos (sem `PATCH /status`)

| Comando | Rota HTTP |
|---------|-----------|
| `StartServiceOrder` | `POST .../execution/start` |
| `PauseServiceOrder` | `POST .../execution/pause` |
| `ResumeServiceOrder` | `POST .../execution/resume` |
| `CompleteServiceOrder` | `POST .../execution/complete` |
| `RecordQuantity` | `POST .../execution/entries/quantity` |
| `RecordMileage` | `POST .../execution/entries/mileage` |
| `RecordHourMeter` | `POST .../execution/entries/hour-meter` |
| `RecordObservation` | `POST .../execution/entries/observation` |
| `RecordOccurrence` | `POST .../execution/occurrences` |
| `RecordEvidence` | `POST .../execution/evidence` |
| Leitura | `GET .../execution` |

Corpo de transição: `{ "rowVersion": number, "idempotencyKey"?: string }`.

## Máquina de estados (execução)

| Transição | De | Para |
|-----------|-----|------|
| `start` | `RELEASED` | `IN_EXECUTION` |
| `pause` | `IN_EXECUTION` | `PAUSED` |
| `resume` | `PAUSED` | `IN_EXECUTION` |
| `complete` | `IN_EXECUTION` | `COMPLETED` |

## Start — pré-condições

- Autorização `execution:start`
- OS em `RELEASED`
- Client elegível (quando aplicável)
- Recursos mínimos **planejados** conforme snapshot (`requirements.resources` / `requirements.labor`)
- `expectedVersion` (optimistic lock)
- Transação única com `FOR UPDATE`

## Evidências

Requirements de execução vêm do **snapshot** da OS (`requirements.execution`).

Tipos reconhecidos: `PHOTO`, `DOCUMENT`, `SIGNATURE`, `LOCATION`, `MILEAGE`, `HOUR_METER`, `QUANTITY`, `OBSERVATION`.

Unidades de medida validadas contra UoM do catálogo/snapshot — unidade arbitrária rejeitada.

## Complete

Valida evidências `REQUIRED` **antes** da transição de estado. Ausência → `REQUIRED_EVIDENCE_MISSING` (sem criar `COMPLETED` e verificar depois).

## Concorrência e idempotência

- `FOR UPDATE` + checagem de `row_version` e status
- Cenários testados: start×start, pause×complete, complete×complete, record×complete
- Comandos sensíveis: `execution_command_idempotency` + `idempotency_key` por registro
- Retry HTTP com mesma chave retorna resposta original (idempotência verificada **antes** da máquina de estados)

## Auditoria

- **Business history**: `service_order_history_events` (STARTED, PAUSED, RESUMED, COMPLETED)
- **Operational entries**: tabelas `execution_*`
- **Security audit**: ações `service-orders:execution:*` (separado do domínio)

## Migração

`0022_service_order_execution_baseline.sql` — status `PAUSED`, colunas de lifecycle, tabelas de execução e idempotência.

## Testes

```bash
cd apps/api
npx vitest run src/service-orders/domain/service-order-execution.spec.ts
npx vitest run src/service-orders/domain/service-order.state-machine.spec.ts
npx vitest run --config vitest.integration.config.ts src/service-orders/service-order-execution.integration.spec.ts
npx vitest run --config vitest.e2e.config.ts src/service-orders/service-order-execution.e2e.spec.ts
npx vitest run --config vitest.integration.config.ts src/service-orders/
npx tsc -b
npx eslint "src/service-orders/**/*.{ts,tsx}"
```
