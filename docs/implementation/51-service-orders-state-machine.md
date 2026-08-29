# Prompt 51 — Service Orders State Machine

## Escopo

Máquina de estados explícita para Ordem de Serviço (sem `PATCH status`).

## Estados canônicos

`DRAFT` → `PREPARED` → `RELEASED` → (`IN_EXECUTION` reservado) → `COMPLETED` | `CANCELLED`

Transições implementadas neste prompt:

| Comando | De | Para |
|---------|-----|------|
| `PrepareServiceOrder` | `DRAFT` | `PREPARED` |
| `ReleaseServiceOrder` | `PREPARED` | `RELEASED` |
| `CancelServiceOrder` | `DRAFT`, `PREPARED`, `RELEASED` | `CANCELLED` |

`AssignServiceOrder` / `AcknowledgeServiceOrder` / `Start` / `Complete` **não** implementados — dependências inexistentes.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| `PATCH` | `/api/v1/service-orders/:id` | Atualização mutável (DRAFT/PREPARED) |
| `POST` | `/api/v1/service-orders/:id/prepare` | `DRAFT` → `PREPARED` |
| `POST` | `/api/v1/service-orders/:id/release` | `PREPARED` → `RELEASED` |
| `POST` | `/api/v1/service-orders/:id/cancel` | Cancelamento |

Corpo de transição: `{ "rowVersion": number }`. Cancel: `{ "rowVersion", "cancellationReason" }`.

## Release (BR-037)

`ReleaseServiceOrder` invoca `assertClientEligibleForServiceOrderRelease`:

- Client definido e existente
- Client `ACTIVE`
- Service definition/version válida com snapshot
- Autorização + `expectedVersion` (optimistic lock)

Transação: `FOR UPDATE` → version check → invariantes → transição → history → audit → commit.

## Mutabilidade

| Status | Campos mutáveis |
|--------|-----------------|
| `DRAFT` | Todos (incl. client, service, commercial refs) |
| `PREPARED` | `description`, `location`, `priority`, `operationalNotes` |
| `RELEASED+` | Nenhum |

## Migração

`0020_service_orders_state_transitions.sql` — colunas `prepared_at/by`, `released_at/by`, `cancelled_at/by`, `cancellation_reason` + CHECK constraints.

## Testes

```bash
cd apps/api
npx vitest run src/service-orders/domain/
npx vitest run --config vitest.integration.config.ts src/service-orders/
```
