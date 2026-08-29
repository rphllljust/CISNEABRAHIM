# Prompt 27 — Gate integrado da fundação técnica

Auditoria consolidada da fundação técnica antes de módulos empresariais (clientes, OS, documentos).

**Executado em:** 2026-08-29  
**Base Git:** `3b7572b` (Prompt 26)  
**Decisão:** `READY_WITH_RESTRICTIONS`

## Matriz de quality gates

| Gate | Comando | Resultado | Evidência |
|------|---------|-----------|-----------|
| Instalação reproduzível | `npx pnpm@9.15.9 install --frozen-lockfile` | PASS | Lockfile resolvido sem alterações |
| Format check | `npx pnpm@9.15.9 run format:check` | PASS (após correção) | 69 arquivos com drift Prettier corrigidos via `format` |
| Lint | `npx pnpm@9.15.9 run lint` | PASS | turbo 3/3 |
| Typecheck | `npx pnpm@9.15.9 run typecheck` | PASS | turbo 3/3 |
| Unit | `npx pnpm@9.15.9 run test` | PASS | database 3, api 37, web 28 |
| Integração (PostgreSQL real) | `npx pnpm@9.15.9 run test:integration` | PASS | database 20, api 28 |
| E2E API | `npx pnpm@9.15.9 run test:e2e` | PASS | api 13 |
| E2E frontend | incluído em `@cisne/web` test | PASS | auth-flow 4, shell 13 |
| Build | `npx pnpm@9.15.9 run build` | PASS | sem `.env` commitado |
| Migrations banco vazio | `drizzle-kit migrate` em `cisne_migration_gate_test` | PASS | 12 tabelas técnicas, 0 empresariais |
| Seed idempotente | `seed.bootstrap.integration.spec.ts` | PASS | `already_exists` na segunda execução |
| Autenticação | auth integration + e2e + adversarial | PASS | login, refresh, logout, reuse |
| Refresh concorrente | `auth.adversarial.integration.spec.ts` | PASS | um vencedor por token |
| Logout | auth e2e + adversarial | PASS | logout e logout-all |
| Deny-by-default | authorization integration + e2e | PASS | PDP nega sem grant |
| Cross-scope | contextual-scope e2e + integration | PASS | zero vazamento entre UNIT |
| Audit redaction | audit-redaction + security-audit specs | PASS | sem segredo em metadata |
| Auditoria dependências (`--prod`) | `npx pnpm@9.15.9 audit --prod` | PASS | 0 vulnerabilidades |
| Auditoria dependências (full) | `npx pnpm@9.15.9 audit --audit-level=moderate` | 1 moderate (dev) | esbuild via drizzle-kit |
| Busca de segredos | grep padrões + revisão `.env.example` | PASS | 0 segredos reais commitados |

## Cenários integrados (12/12)

| # | Cenário | Status | Evidência principal |
|---|---------|--------|---------------------|
| 1 | Anônimo não acessa rota protegida | PASS | `auth.e2e.spec.ts`, `auth-flow.e2e.test.tsx` |
| 2 | Login inválido não enumera usuário | PASS | `auth.integration.spec.ts`, `LoginPage.test.tsx` |
| 3 | Autenticado sem permissão é negado | PASS | `authorization.e2e.spec.ts` |
| 4 | Cross-scope não vaza dados | PASS | `contextual-scope.e2e.spec.ts` |
| 5 | Revogação produz efeito | PASS | `authorization.integration.spec.ts`, grant revoke |
| 6 | Sessão expirada remove acesso | PASS | `auth.integration.spec.ts`, disabled account e2e |
| 7 | Refresh repetido não duplica sessão | PASS | `auth.adversarial.integration.spec.ts`, refresh reuse e2e |
| 8 | Campos internos não aparecem | PASS | `assertNoSensitiveLeak`, serializers allowlist |
| 9 | Ação sensível gera audit sanitizado | PASS | `security-audit.integration.spec.ts`, e2e |
| 10 | Banco vazio recebe migrations | PASS | `cisne_migration_gate_test` — schemas identity, authorization, audit, infrastructure |
| 11 | Seed não duplica | PASS | `seed.bootstrap.integration.spec.ts` |
| 12 | Build não depende de segredo commitado | PASS | build sem `.env`; JWT via env em runtime |

## Revisão de código

| Item verificado | Resultado |
|-----------------|-----------|
| `any` injustificado | 0 ocorrências em `apps/` e `packages/` |
| TODO/FIXME crítico | 0 |
| Teste pulado (`it.skip` / `describe.skip`) | 0 |
| Mock substituindo PostgreSQL em integração | 0 — todos usam `TEST_DATABASE_URL` real |
| Role ampla / bypass auth | 0 — grants explícitos por ação/recurso/escopo |
| Autorização apenas no frontend | Não — backend `AuthorizationGuard` + PDP; frontend só UX |
| Segredo commitado | 0 — `.env.example` usa placeholders |
| Log sensível | 0 padrões password/token em `console.log` |
| Migration destrutiva (`DROP TABLE`/`TRUNCATE`) | 0 em `migrations/*.sql` |
| Tabela empresarial prematura | 0 — `identity.persistence.integration.spec.ts` confirma ausência |
| Vulnerabilidade crítica | 0 (`audit --prod`) |

## Esquemas e tabelas (pós-migration)

| Schema | Tabelas |
|--------|---------|
| `identity` | identities, credentials, sessions, refresh_token_families, refresh_tokens |
| `authorization` | grants, scope_refs, decision_audits, scoped_records |
| `audit` | security_audit_events |
| `infrastructure` | schema_baseline |

**Business tables:** 0

## Riscos residuais

| Risco | Severidade | Decisão |
|-------|------------|---------|
| Rate limit login in-memory (single instance) | MÉDIA | Aceito para dev/MVP; store compartilhado antes de multi-instância |
| esbuild ≤0.24.2 via drizzle-kit (dev only) | MODERATE | Aceito — não em runtime de produção; monitorar upgrade drizzle-kit |
| `ensure-migrations.ts` aplica SQL manual 0003–0005 quando ausente | BAIXA | Aceito — fallback de teste; `drizzle-kit migrate` cobre banco vazio |
| Sessões simultâneas ilimitadas por identidade | BAIXA | Documentado no Prompt 21; sem limite nesta fase |
| Imutabilidade de audit sem hash chain | BAIXA | Append-only PostgreSQL; sem alegação criptográfica |

## Correções aplicadas neste prompt

| Correção | Escopo |
|----------|--------|
| Drift Prettier (69 arquivos) | Formatação — sem alteração de comportamento |

Nenhum módulo empresarial implementado. Prompt 28 não executado.
