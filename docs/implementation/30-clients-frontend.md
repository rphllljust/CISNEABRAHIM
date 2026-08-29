# Prompt 30 — Módulo de Clientes: interface web

**Status:** `EXECUTED`  
**Executado em:** 2026-08-29  
**Base Git:** `bb540cc` (auditoria 29-B)  
**Pré-condição:** backend Clients aprovado; SRC-002 `LIBERADO`

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Interface Clientes PJ | **SIM** |
| Cliente PF / CRM | **NÃO** |
| Frontend como autoridade de negócio | **NÃO** |
| Prompt 31 | **NÃO executado** |

## Telas

| Rota | Componente | Descrição |
| ---- | ---------- | --------- |
| `/app/clients` | `ClientsListPage` | Listagem paginada com filtro `status` |
| `/app/clients/new` | `ClientCreatePage` | Cadastro PJ |
| `/app/clients/:id` | `ClientDetailPage` | Detalhe, desativar, reativar |
| `/app/clients/:id/edit` | `ClientEditPage` | Edição com `version` |

Navegação: item **Clientes** visível somente após probe `client:client:list` (escopo GLOBAL no backend).

## Contratos HTTP consumidos

| Operação | Endpoint | Payload / query |
| -------- | -------- | ----------------- |
| Listar | `GET /api/v1/clients` | `limit`, `offset`, `status?` |
| Detalhe | `GET /api/v1/clients/:id` | — |
| Criar | `POST /api/v1/clients` | `legalName`, `taxId`, `contacts[]`, opcionais |
| Editar | `PATCH /api/v1/clients/:id` | `version` + campos editáveis |
| Desativar | `POST /api/v1/clients/:id/deactivate` | `version`, `reason` |
| Reativar | `POST /api/v1/clients/:id/activate` | `version` |

**Não implementado no backend (Release 1):** busca textual, ordenação parametrizada, total de registros. A UI não simula esses comportamentos.

## Estados de UX

| Estado | Comportamento |
| ------ | ------------- |
| Loading | `aria-busy`, mensagens de carregamento |
| Empty | Mensagem quando `items.length === 0` |
| Erro | Mensagem sanitizada + retry quando aplicável |
| 403 listagem | Acesso negado; sem enumeração local |
| CNPJ duplicado | Mensagem empresarial (`CLIENT_TAX_ID_CONFLICT`) |
| VERSION_CONFLICT | Mensagem fixa + botão recarregar dados atuais |
| Double-submit | Botão desabilitado + `aria-busy` durante submissão |

## Concorrência otimista

Todas as mutações enviam `version` recebida do backend. Em `CLIENT_VERSION_CONFLICT` a UI **não** sobrescreve silenciosamente; exibe:

> Este Cliente foi alterado por outro usuário. Atualize os dados antes de tentar novamente.

## Autorização visual

Hook `useClientCapabilities` faz probes leves (respostas 403 vs 400/404) para:

- `canCreate`, `canUpdate`, `canDeactivate`, `canActivate`

Botões são ocultados quando o probe indica ausência de capability. **Backend permanece autoridade** — teste `clients-api.authorization.test.ts` comprova 403 mesmo se a UI fosse manipulada.

Listagem: probe de rota (`ClientsRoute`) + resposta 403 do `GET /clients`.

## Desativação / reativação

- Modal acessível (`<dialog>`) com motivo obrigatório na desativação
- Mensagem de consequência empresarial preservada
- Histórico de desativação exibido após reativação (campos `deactivatedAt`, `deactivationReason`)
- Reativação usa `POST .../activate`, não `PATCH`

## Segurança

- Sem persistência de lista em `localStorage`
- Erros SQL/internos não exibidos
- Conteúdo renderizado via React (sem `dangerouslySetInnerHTML`)

## Testes

| Suite | Escopo |
| ----- | ------ |
| `ClientsListPage.test.tsx` | listagem, 403, filtro status |
| `ClientCreatePage.test.tsx` | validação, CNPJ duplicado, permissão |
| `ClientEditPage.test.tsx` | VERSION_CONFLICT |
| `clients-api.authorization.test.ts` | backend 403 com UI bypass |
| `clients.e2e.test.tsx` | fluxo administrativo completo (mock HTTP) |
| `shell.e2e.test.tsx` | regressão shell + nav Clientes |

## Quality gate (evidência)

- [x] `pnpm lint` — PASS
- [x] `pnpm typecheck` — PASS
- [x] `pnpm test` — PASS
- [x] `pnpm test:integration` — PASS
- [x] `pnpm --filter @cisne/api test:e2e` — PASS
- [x] `pnpm build` — PASS
- [x] `pnpm gate:src-002` — PASS

Prompt 31 não executado.
