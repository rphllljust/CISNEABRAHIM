# Prompt 44 — Ativos físicos e veículos (frontend)

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(web): implement physical asset management` |
| **Próximo passo autorizado** | Prompt 45 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Lista paginada com busca e filtros | **SIM** — lifecycle/allocation/tipo (API) + busca local |
| Detalhe, criação, edição | **SIM** |
| Ativação / desativação | **SIM** |
| Compreensão de ResourceType | **SIM** — seleção de tipo; campos de veículo só para `VEHICLE` |
| Lifecycle ≠ allocation na UI | **SIM** — badges e texto explicativo separados |
| Capabilities controlam UX | **SIM** |
| VERSION_CONFLICT tratado | **SIM** |
| Prompt 45 executado | **NÃO** |

## Rotas (`apps/web`)

| Rota | Página |
| ---- | ------ |
| `/app/assets` | Lista |
| `/app/assets/new` | Criar |
| `/app/assets/:assetId` | Detalhe |
| `/app/assets/:assetId/edit` | Editar |

## Módulo

`apps/web/src/assets/` — API client, hooks, formulário condicional, páginas e testes.

## Testes

- Unit: query builder, form state, authorization probe
- Component: `AssetForm` (vehicle vs machine), list badges
- E2E (Vitest + fetch mock): list → detail → edit conflict; nav negada

## Quality gate

- [x] lint, typecheck, test (web) — PASS
- [x] Prompt 45 não executado
