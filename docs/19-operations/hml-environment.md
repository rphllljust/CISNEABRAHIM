# OPS-HML-001 — Ambiente de homologação

| Campo | Valor |
| ----- | ----- |
| Document ID | OPS-HML-001 |
| Prompt | 86 |
| Status | IMPLEMENTED (engenharia) |

## Isolamento (obrigatório)

| Recurso | HML | Produção |
| ------- | --- | -------- |
| Database | `cisne_hml` dedicado | instância separada |
| Object storage | bucket/prefixo `*-hml-*` | bucket prod |
| Secrets | `JWT_*`, bootstrap HML | secrets prod |
| URLs | `HML_PUBLIC_*` | URLs prod |

Guards: `apps/api/src/ops/hml/hml-config.ts` (`assertHmlIsolation`).

**Nunca** compartilhar DB com produção. Cópia de PII exige processo de mascaramento (SEC-THR-029).

## Build promovível

Imagens `docker/hml/Dockerfile.api` e `Dockerfile.web` executam o **mesmo** `pnpm build` do CI — não há compilação alternativa para produção.

Artefatos CI: `.github/workflows/ci.yml` job `build`.

## Dados

- Bootstrap sintético: `HML_BOOTSTRAP_SYNTHETIC=true` + `HML_SYNTHETIC_SEED_CONFIRM=I_UNDERSTAND`
- Credenciais fictícias em `.env.hml.example` (`@cisne.invalid`)
- Portfolio seed via `pnpm db:seed:portfolio` (dados de catálogo sintéticos)

## Integrações

- `HML_INTEGRATIONS_SANDBOX=true` (default)
- Email/WhatsApp outbound **desligados** por padrão
- Providers reais apenas em modo sandbox homologação do vendor

## Migrations

Deploy aplica migrations via Drizzle (`pnpm --filter @cisne/database migrate`) — **sem** alteração manual de schema.

## Smoke pós-deploy

`pnpm hml:smoke` ou etapa automática em `pnpm hml:deploy`:

health → login → clients → requests → OS → execution → measurements → billing → documents + observability metrics.

## Observabilidade

HML expõe `/api/v1/observability/metrics` e `/api/v1/observability/alerts` com a mesma stack da API.

## Operação rápida

```bash
cp .env.hml.example .env.hml
pnpm hml:up
pnpm hml:deploy
pnpm hml:smoke
```

Parar: `pnpm hml:down`
