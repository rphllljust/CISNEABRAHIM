# Prompt 42 — Frontend administrativo do catálogo

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(web): implement service catalog administration` |
| **Próximo passo autorizado** | Prompt 43 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Listagem com paginação e filtros | **SIM** — status (API) + busca/filtro de versão (página atual) |
| Detalhe, criação, edição de rascunho | **SIM** |
| Nova versão e comparação client-side | **SIM** |
| Publicação / desativação / reativação | **SIM** — via API; sem regra no browser |
| Versão publicada não editável na UX | **SIM** — ação correta: criar nova versão |
| Formulário estruturado (sem JSON textarea) | **SIM** |
| Capabilities controlam UX | **SIM** |
| `CATALOG_VERSION_CONFLICT` tratado | **SIM** — aviso + recarregar |
| Prompt 43 executado | **NÃO** |

## Rotas (`apps/web`)

| Rota | Página |
| ---- | ------ |
| `/app/catalog` | Lista |
| `/app/catalog/new` | Criar definição |
| `/app/catalog/:definitionId` | Detalhe + versões |
| `/app/catalog/:definitionId/versions/:versionNumber` | Detalhe da versão |
| `/app/catalog/:definitionId/versions/:versionNumber/edit` | Editar rascunho |
| `/app/catalog/:definitionId/versions/new` | Nova versão |
| `/app/catalog/:definitionId/compare` | Comparar versões |

## Módulo

`apps/web/src/catalog/` — API client, hooks de capabilities/referências, formulário estruturado, páginas e testes.

## Testes

- Unit: API query builder, form state, version compare
- Authorization: probe de listagem
- Component: `ServiceDefinitionForm`, `VersionComparePanel`
- Integration: `ServiceDefinitionsListPage`
- E2E (Vitest + fetch mock): fluxo list → detail → nova versão → publicar

## Quality gate

- [x] lint, typecheck, test (web), test:integration, test:e2e — PASS
