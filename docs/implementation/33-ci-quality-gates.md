# Prompt 33 — CI profissional e quality gates de engenharia

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Base Git** | `9ad53a6` (Prompt 32 aprovado) |
| **Workflow** | `.github/workflows/ci.yml` |
| **Próximo passo autorizado** | Prompt 34 (não executado nesta entrega) |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Pipeline CI única | **SIM** |
| Ambiente reproduzível (Node/pnpm lockfile) | **SIM** |
| Database gate descartável | **SIM** |
| Secrets no Git/workflow | **NÃO** |
| `continue-on-error` em gates críticos | **NÃO** |
| Prompt 34 executado | **NÃO** |

---

## 1. Baseline pré-alteração

| Item | Evidência |
| ---- | --------- |
| Prompt 32 concluído | commit `9ad53a6` |
| Migration `0007_service_catalog_baseline.sql` | presente |
| Working tree clean | confirmado antes da execução |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS |
| `pnpm test:integration` | PASS |
| `pnpm build` | PASS |
| `pnpm gate:src-002` | PASS |
| CI existente | **ausente** — pipeline criada (não concorrente) |

---

## 2. Ambiente reproduzível

| Artefato | Valor / política |
| -------- | ---------------- |
| Node | `.node-version` → `24` (alinha `engines` `>=24 <25`) |
| pnpm | `9.15.9` (`packageManager` + workflow) |
| Instalação | `pnpm install --frozen-lockfile` |
| Workspace | `pnpm-workspace.yaml` + `turbo.json` |
| Banco de teste | PostgreSQL `18-alpine` descartável por job |
| Credenciais | variáveis descartáveis no workflow (não são secrets de produção) |

---

## 3. Pipeline CI

Arquivo: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

```text
push / pull_request
        │
        ▼
┌───────────────────────────┐
│ static-quality            │
│ install → lint            │
│        → typecheck        │
│        → audit:deps       │
│        → gate:src-002     │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ unit-tests                │
│ install → pnpm test       │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ database-and-integration  │
│ postgres:18 (service)     │
│ → gate:database           │
│ → db:migrate:test         │
│ → test:integration        │
│ → test:e2e (API)          │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ build                     │
│ → pnpm build              │
│ → build-metadata artifact │
└───────────────────────────┘
```

**Paralelização:** jobs sequenciais por dependência (`needs`). Dentro de cada job, etapas críticas são sequenciais. Não há `continue-on-error` em gates obrigatórios.

**E2E:** API (`pnpm test:e2e`) com PostgreSQL. Frontend E2E roda em `pnpm test` (Vitest/jsdom) sem browser farm — documentado como viável nesta fase.

---

## 4. Database gate

Script: [`packages/database/scripts/ci-database-gate.mjs`](../../packages/database/scripts/ci-database-gate.mjs)  
Comando: `pnpm gate:database`

| Validação | Implementação |
| --------- | ------------- |
| A) Migrations em banco vazio | recria `cisne_gate_fresh`, aplica `0000`→`0007` |
| B) Upgrade incremental | recria `cisne_gate_incremental`, aplica `0000`→`0006`, depois `0007` |
| C) Constraints | duplicidade `service_definitions.code` → `23505` |
| D) Seeds técnicos | `infrastructure.schema_baseline` com `baseline_version` |
| E) Schema final | schemas `infrastructure`, `identity`, `authorization`, `audit`, `pty`, `cat` + tabelas-chave |

Nunca usa banco de desenvolvimento compartilhado — apenas DBs efêmeros criados no runner.

---

## 5. Secrets

| Regra | Status |
| ----- | ------ |
| Secrets no Git | **PROTEGIDO** |
| Secrets hardcoded de produção | **ausentes** |
| JWT/DB no workflow | credenciais **descartáveis** de CI, não reutilizáveis |
| Logs / artifacts | sem exportar `.env`; metadata sem segredos |

Quando integrações externas forem necessárias, usar GitHub Secrets — nenhuma configurada neste prompt.

---

## 6. Cache

- `actions/setup-node` com `cache: pnpm`
- Chave implícita: lockfile + Node major
- **Não** cacheia: PostgreSQL, secrets, dados de usuário, builds entre jobs (cada job faz install)

---

## 7. Security checks

| Ferramenta | Comando | Política |
| ---------- | ------- | -------- |
| `pnpm audit` | `pnpm audit:deps` | falha em **high/critical** (`--audit-level=high`) |
| Estado atual | 1 moderate (transitiva) | **não bloqueia** — abaixo do threshold; monitorar |

Nenhum scanner pesado adicional introduzido.

---

## 8. Artifact traceability

Script: [`scripts/ci-emit-build-metadata.mjs`](../../scripts/ci-emit-build-metadata.mjs)

`artifacts/ci/build-metadata.json` contém:

- `commitSha`
- `buildRunId` / `workflow`
- `nodeVersion`
- `pnpmVersion`
- `timestamp`

Artifact upload: `apps/api/dist`, `apps/web/dist`, `packages/database/dist`, metadata.  
Sem embedding de secrets no bundle frontend.

---

## 9. Branch / merge protection

| Item | Status |
| ---- | ------ |
| Workflow em `push` + `pull_request` | configurado |
| Branch protection no GitHub | **ação operacional pendente** — requer permissão de admin no remote |
| Recomendação | tornar job `build` (ou workflow completo) required check em `master`/`main` |

Não afirmado como aplicado sem evidência de configuração remota.

---

## 10. Validação de bloqueio da CI

Validação local do mecanismo de falha:

1. Introduzir erro sintático temporário → `pnpm lint` retorna exit code `≠ 0`
2. Reverter antes do commit final

Nenhuma alteração quebrada permanece no branch.

---

## 11. Scripts reais utilizados

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm gate:database
pnpm db:migrate:test
pnpm test:integration
pnpm test:e2e
pnpm audit:deps
pnpm gate:src-002
pnpm build
```

---

## 12. Quality gate (evidência local pós-implementação)

- [x] `.github/workflows/ci.yml` criado
- [x] `.node-version` + pnpm fixado
- [x] `gate:database` + `audit:deps`
- [x] `ensure-migrations` alinhado à `0007`
- [x] Documentação única deste prompt
- [x] lint, typecheck, test, test:integration, build, gate:src-002 — PASS
- [x] Prompt 34 não executado

---

## Referências

- [`migration-workflow.md`](../18-database-foundation/migration-workflow.md)
- [`32-service-catalog-persistence.md`](./32-service-catalog-persistence.md)
- [`engineering-principles.md`](../00-governance/engineering-principles.md)
