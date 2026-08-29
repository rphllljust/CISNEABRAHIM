# Prompt 50 — Ordem de serviço: núcleo backend

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(service-orders): implement service order aggregate` |
| **Próximo passo autorizado** | Prompt 51 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| ServiceOrder como aggregate root (`so.service_orders`) | **SIM** |
| Identidade interna + `order_number` empresarial único | **SIM** |
| Origens: ServiceRequest, Proposal, PO, autorização direta | **SIM** |
| Conversão atômica Request → OS (lock, snapshot, CONVERTED) | **SIM** |
| Snapshot de catálogo (código, arquétipo, medição, UoM, requisitos) | **SIM** |
| Referências comerciais com snapshot seletivo | **SIM** |
| OS nasce somente em `DRAFT` | **SIM** (validação de domínio) |
| Unique `service_request_id` + `FOR UPDATE` | **SIM** |
| Histórico empresarial + auditoria de segurança separados | **SIM** |
| BR-037 preservada (release no Prompt 51) | **SIM** — guard não enfraquecido |
| Prompt 51 executado | **NÃO** |

## Schema (`0019_service_orders_baseline.sql`)

| Objeto | Descrição |
| ------ | --------- |
| `so.service_orders` | Aggregate root |
| `so.service_order_history_events` | Histórico empresarial append-only |
| FK `sr.service_requests.converted_service_order_id` → `so.service_orders` | Integridade 1:1 |

## API (`/api/v1/service-orders`)

| Método | Path | Ação |
| ------ | ---- | ---- |
| POST | `/` | Criar OS em `DRAFT` |
| GET | `/` | Listar (escopo UNIT/CLIENT/GLOBAL) |
| GET | `/:id` | Detalhe + histórico |

Conversão de solicitação: `POST /api/v1/requests/service-requests/:id/convert` (transação única via `ServiceRequestConversionService`).

## Quality gate

- [x] create DRAFT, request conversion, double conversion race
- [x] rejected/cancelled request, catalog snapshot, client/PO/proposal refs
- [x] rollback on failed conversion, authorization, concurrency, DTO, E2E
- [x] lint, typecheck, test, test:integration, test:e2e — PASS
- [x] Prompt 51 não executado
