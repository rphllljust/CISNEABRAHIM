# Prompt 23 — Escopo contextual e isolamento de dados

Autorização contextual (AUTHZ-SCOPE-001) sem multitenancy presumido e sem `tenant_id` indiscriminado.

## Modelo de escopos

| Escopo | Âncora (`resource_id`) | Semântica técnica |
|--------|--------------------------|-------------------|
| `OWN` | opcional | Registros do próprio ator |
| `ASSIGNED` | opcional | Registros atribuídos ao ator |
| `UNIT` | obrigatória (`scope_refs`) | Isolamento por unidade operacional |
| `CLIENT` | obrigatória | Isolamento por cliente/contratante |
| `CONTRACT` | obrigatória | Isolamento por contrato/PO |
| `DOCUMENT` | obrigatória | Isolamento documental |
| `FINANCIAL` | obrigatória (contrato) | Dados financeiros no contrato âncora |
| `GLOBAL` | **deve ser `null`** | Amplo — sem global implícito |
| `PLATFORM` | técnico (Prompt 22) | Infra `platform:*` / `authz:*` |

Papéis empresariais (ROLE-CAND): **não implementados**.

## Arquitetura de enforcement

```text
Request (JWT)
  → ScopedRecordAccessService
      → findActiveGrants (PostgreSQL)
      → ScopeEnforcementService.buildScopedRecordListFilter (listagem)
      → PolicyDecisionPointService + grantMatchesResourceContext (recurso)
      → ScopeContextRepository (dados reais — não confia no cliente)
```

| Componente | Função |
|------------|--------|
| `scope-matcher.ts` | Casa concessão × contexto do recurso |
| `ScopeResolverService` | Resolve escopo efetivo |
| `ScopeEnforcementService` | Filtros SQL obrigatórios + validação UUID |
| `GrantAdminService` | Valida âncora, anti self-escalation, shape GLOBAL |
| `scope_refs` | Referências válidas — concessão não órfã |
| `scoped_records` | Fixture técnica de isolamento (não OS/faturamento) |

## Persistência

Migrations:

- `0003_contextual_scope_enums.sql` — enum estendido
- `0004_contextual_scope_tables.sql` — `scope_refs`, `scoped_records`, constraints, índice único ativo

Constraints relevantes:

- `grants_global_no_resource_chk` — GLOBAL sem `resource_id`
- `grants_anchored_scope_requires_ref_chk` — UNIT/CLIENT/… exigem âncora
- `grants_active_scope_unique_idx` — unicidade de concessão ativa
- `scope_refs` — âncoras registradas antes da concessão

## Rotas de prova (`authz:scoped-record`)

| Método | Rota | AuthZ |
|--------|------|-------|
| `GET` | `/api/v1/authz/scoped-records` | listagem filtrada por escopo |
| `GET` | `/api/v1/authz/scoped-records/:id` | leitura com PDP contextual |
| `PATCH` | `/api/v1/authz/scoped-records/:id` | alteração com PDP contextual |

Negação HTTP: `403 AUTHZ_DENIED` / mensagem genérica `"Access denied."`

## Limitações declaradas

- Sem `tenant_id` global — isolamento por âncoras explícitas
- `scoped_records` é **fixture técnica**, não modelo empresarial de OS/faturamento
- Escopos empresariais permanecem `CANDIDATE`/`PENDING` em `access-scope-candidates.md`
- Matriz CMD × ROLE-CAND fora de escopo

## Evidências de teste (vazamentos cross-scope: **0**)

| Arquivo | Cenários |
|---------|----------|
| `scope-matcher.spec.ts` | GLOBAL explícito, UNIT, ASSIGNED, FINANCIAL |
| `contextual-scope.integration.spec.ts` | in-scope, cross-scope, expirado, self-escalation, ASSIGNED |
| `contextual-scope.e2e.spec.ts` | listagem + lookup direto sem vazamento |

```bash
npx pnpm@9.15.9 db:migrate
npx pnpm@9.15.9 test
npx pnpm@9.15.9 test:integration
npx pnpm@9.15.9 test:e2e
```

## Fora de escopo

- Prompt 24 não executado
- Multitenancy não confirmado
- Papéis empresariais definitivos
