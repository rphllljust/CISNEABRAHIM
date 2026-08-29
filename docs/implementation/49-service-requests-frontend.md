# Prompt 49 — Solicitação de serviço: frontend

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(web): implement service request interface` |
| **Próximo passo autorizado** | Prompt 50 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| UI consome API real `/api/v1/requests/service-requests` | **SIM** |
| Máquina de estados duplicada no browser | **NÃO** — ações via endpoints; botões condicionados ao `status` retornado |
| Conversão para OS na UI | **NÃO** — ausente até Prompt 50 |
| Origem vs Registrado por | **SIM** — seções distintas no detalhe |
| Cliente opcional com seletor autorizado | **SIM** — lista de Clientes via API; sem criação implícita |
| VERSION_CONFLICT com recarga | **SIM** |
| Capabilities apenas UX | **SIM** — probes + teste de autorização |
| Prompt 50 executado | **NÃO** |

## Rotas

| Rota | Página |
| ---- | ------ |
| `/app/requests` | Lista + filtros + paginação |
| `/app/requests/new` | Criar rascunho |
| `/app/requests/:id` | Detalhe + submit/review/approve/reject/cancel |
| `/app/requests/:id/edit` | Editar rascunho (`DRAFT`) |

## Quality gate

- [x] create, edit, submit, approve, reject, cancel
- [x] forbidden, stale version, loading, empty, error
- [x] accessibility (`aria-*`, `role="alert"`, `<dialog>`)
- [x] E2E (`service-requests.e2e.test.tsx`)
- [x] `pnpm --filter @cisne/web` lint, typecheck, test — PASS
- [x] Prompt 50 não executado
