# Prompt 25 — Application shell protegido

Shell autenticado e acessível sem dashboard fictício ou módulos empresariais.

## Componentes

| Componente | Responsabilidade |
|------------|------------------|
| `shell/AppShellLayout.tsx` | Layout protegido, skip link, outlet |
| `shell/AppHeader.tsx` | Marca, identificação mínima da sessão, logout |
| `shell/AppNav.tsx` | Navegação estrutural responsiva |
| `shell/CapabilityRoute.tsx` | Guard de rota com probe backend |
| `shell/ShellErrorBoundary.tsx` | Erro inesperado sem vazar detalhes |
| `shell/useNavAccess.ts` | Visibilidade de menu via backend |
| `shell/nav-config.ts` | Itens estruturais (sem módulos empresariais) |
| `auth/api/authz-api.ts` | `GET /api/v1/authz/probe` |

## Rotas técnicas

| Rota | Proteção | Descrição |
|------|----------|-----------|
| `/app` | Auth + shell | Página inicial técnica |
| `/app/platform` | Auth + shell + capability | Probe de plataforma (CAP-001) |
| `/app/no-access` | Auth + shell | Acesso negado por capability |
| `/session-expired` | pública | Sessão encerrada |
| `/login` | pública | Login (aviso se `reason=session_expired`) |

## Capabilities e backend

- Menu **Home** — sempre visível para sessão autenticada.
- Menu **Platform diagnostics** — visível somente se `GET /api/v1/authz/probe` retorna `200`.
- Deep link em `/app/platform` sem permissão → `/app/no-access` com `CAP-001`.
- Frontend **não** decide autorização final; apenas reflete respostas do backend.

## Acessibilidade

| Controle | Implementação |
|----------|----------------|
| Landmarks | `header` (banner), `nav`, `main` |
| Skip link | `#main-content` |
| Teclado / foco | `:focus-visible`, menu mobile com `aria-expanded` |
| Contraste | Texto `#1a1a1a` em fundo `#f5f5f5` / `#fff` |
| Responsividade | Nav colapsável &lt; 48rem; sidebar fixa em desktop |
| Sessão mínima | UUID truncado com `title` completo no hover |

## Estados de erro

| Estado | Comportamento |
|--------|----------------|
| Carregamento | `ProtectedRoute` + `CapabilityRoute` com `aria-busy` |
| Acesso negado (capability) | `/app/no-access` |
| Sessão expirada | `expireSession()` → `/login` com aviso |
| Erro inesperado | `ShellErrorBoundary` |
| Backend indisponível | `/unavailable` (bootstrap) |

## Testes

| Arquivo | Cobertura |
|---------|-----------|
| `shell/shell.e2e.test.tsx` | sessão, ausente, capability, deep link, mobile, logout, rede |
| `shell/format-identity.test.ts` | identificação truncada |
| `shell/ShellErrorBoundary.test.tsx` | erro inesperado |
| `auth/auth-flow.e2e.test.tsx` | login + shell integrado |

```bash
npx pnpm@9.15.9 lint
npx pnpm@9.15.9 typecheck
npx pnpm@9.15.9 test
npx pnpm@9.15.9 build
```

## Fora de escopo

- Cards, gráficos, métricas simuladas
- Módulos cliente, OS, documento, relatório
- Prompt 26 não executado
