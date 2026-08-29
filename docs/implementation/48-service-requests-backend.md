# Prompt 48 — Solicitação de serviço: backend

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(requests): implement service request domain` |
| **Próximo passo autorizado** | Prompt 49 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| ServiceRequest ≠ ServiceOrder | **SIM** — agregado `sr.service_requests` próprio |
| Origens externas (WHATSAPP…OTHER) | **SIM** — enum `service_request_origin` |
| Cliente opcional no intake | **SIM** — exige contato externo quando `client_id` ausente |
| Sem criação automática de Client | **SIM** |
| Máquina de estados explícita (sem PATCH status) | **SIM** — endpoints `/submit`, `/review`, `/approve`, etc. |
| Rejeição/cancelamento exigem motivo | **SIM** |
| REJECTED/CANCELLED/CONVERTED não convertem | **SIM** |
| Porta de conversão (Prompt 50) | **SIM** — `NotReadyServiceRequestConversionPort` |
| Conversão falsa bloqueada | **SIM** — `CONVERTED` exige `converted_service_order_id` no DB |
| Autorização interna | **SIM** — ações `requests:service-request:*` |
| Prompt 49 executado | **NÃO** |

## Schema (`0018_service_requests_baseline.sql`)

| Objeto | Descrição |
| ------ | --------- |
| `sr.service_requests` | Agregado de intake |
| `sr.service_request_document_links` | Vínculos com documentos |

### Estados (`service_request_status`)

`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` | `REJECTED`  
Cancelável em `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`  
`APPROVED` → `CONVERTED` (somente com OS real na mesma transação — Prompt 50)

## API (`/api/v1/requests/service-requests`)

| Método | Path | Ação |
| ------ | ---- | ---- |
| POST | `/` | Criar rascunho |
| GET | `/` | Listar (escopo UNIT/CLIENT/GLOBAL) |
| GET | `/:id` | Detalhe |
| PATCH | `/:id` | Atualizar rascunho |
| POST | `/:id/submit` | Submeter |
| POST | `/:id/review` | Iniciar análise |
| POST | `/:id/approve` | Aprovar (prioridade opcional) |
| POST | `/:id/reject` | Rejeitar (motivo obrigatório) |
| POST | `/:id/cancel` | Cancelar (motivo obrigatório) |
| POST | `/:id/convert` | Converter (retorna `CONVERSION_NOT_READY` até Prompt 50) |
| POST | `/:id/documents` | Vincular documento |

## Quality gate

- [x] create, submit, review, approve, reject, cancel
- [x] invalid transition, duplicate idempotency, stale version
- [x] unauthorized, cross-scope
- [x] document / proposal / PO reference
- [x] conversion port not ready
- [x] lint, typecheck, test, test:integration (service-requests), test:e2e (service-requests) — PASS
- [x] `@cisne/database` build — PASS
- [x] Prompt 49 não executado
