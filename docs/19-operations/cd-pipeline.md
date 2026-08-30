# OPS-CD-001 — Continuous Delivery

| Campo | Valor |
| ----- | ----- |
| Document ID | OPS-CD-001 |
| Prompt | 87 |

## Fluxo

```
commit → CI → artifact (digest) → HML deploy + smoke → acceptance → production (gate manual)
```

## Build once

- CI job `build` compila **uma vez** e publica `cisne-build-<run_id>`
- CD baixa o mesmo artifact — **sem** `pnpm build` no deploy PRD
- `deploy-manifest.json` registra `artifactDigest` + `commitSha`

## Rastreabilidade

Cada deploy registra: `version`, `commitSha`, `artifactDigest`, `buildRunId`, `timestamp`, `environment`.

## HML

- Deploy automático após CI verde (`workflow_run`)
- Smoke obrigatório (`hml:smoke` / `runCdPromotion`)
- Migrations via Drizzle — sem SQL manual

## Produção

- Job `deploy-production` usa `environment: production` (aprovação manual GitHub)
- Exige `PRD_PROMOTION_APPROVED=I_UNDERSTAND`
- Promove **mesmo** `artifactDigest` validado em HML

## Migrations

Classificação em `migration-policy.ts`:

| Risco | Exemplos |
| ----- | -------- |
| backward-compatible | ADD COLUMN, CREATE INDEX, CREATE TABLE |
| breaking-high-risk | DROP TABLE/COLUMN, TRUNCATE, ALTER COLUMN |

Breaking exige `CD_ALLOW_BREAKING_MIGRATIONS=I_UNDERSTAND` + deploy coordenado (expand/contract).

## Secrets

- `cd-secrets.ts` bloqueia secrets embutidos no artifact
- Secrets runtime via env/secret store — nunca no bundle

## Rollback

- `cd-rollback.ts` mantém histórico por ambiente
- Rollback de aplicação = redeploy digest anterior
- **DB não reverte automaticamente**

## Comandos

```bash
pnpm build && node scripts/cd/emit-deploy-manifest.mjs
pnpm cd:promote              # HML
node scripts/cd/promote.mjs --production  # após gate
pnpm --filter @cisne/api test:cd
```
