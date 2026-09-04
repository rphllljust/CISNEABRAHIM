# OPS-HERM-001 — Auditoria de dependências e release hermético (consolidado)

| Campo | Valor |
| ----- | ----- |
| Document ID | OPS-HERM-001 |
| Prompt | HERMETIC PRODUCTION RELEASE (prompt atual) |
| Status | CONSOLIDATED — auditoria concluída (evidência primária), correções aplicadas em andamento |
| Data | 2026-09-04 |

## Objetivo

Registrar a auditoria obrigatória (executada **antes** das modificações) de todas as dependências
de execução do SISTEMA CISNE RONDÔNIA e a classificação de cada uma, conforme o gate do prompt
atual. Evidência primária detalhada (com `file:line`) foi produzida em 7 relatórios de auditoria
na área de trabalho `tmp/audit-hermetic/` (não versionada); este documento consolida os fatos
essenciais e as decisões no repositório.

## Classificação utilizada

- `BUNDLED` — dentro do artefato final (dist/estático/imagem).
- `PROVISIONED_AUTOMATICALLY` — criado pelo install/deploy automaticamente.
- `HOST_PREREQUISITE` — exigido no host e validado explicitamente.
- `OPTIONAL_EXTERNAL_SERVICE` — externo por natureza; nunca bloqueia o core.
- `FORBIDDEN_RUNTIME_DEPENDENCY` — proibido (download em startup, caminho de dev, segredo, etc.).

## Fontes de verdade canônicas (anti-duplicação)

`apps/api` (API + worker), `apps/web` (frontend), `packages/{database,eslint-config,tsconfig}`
(tooling), `docker/`, `scripts/`. `cisne-backend|frontend|infra` são **repos exportados** (gitignored,
publish separado) e estão **defasados** frente ao monorepo (≈36–49% byte-idênticos) — não são fonte
de verdade; o deploy de referência (`docker/prod`, `docker/hml`) constrói a partir do monorepo.

## Matriz de classificação consolidada

### Runtime de servidor (API + worker, @cisne/api/@cisne/database)

| Dependência | Classe | Evidência / notas |
| --- | --- | --- |
| Node.js 24 LTS | HOST_PREREQUISITE | engines `>=24 <25`, `.node-version=24`; imagem `node:24-alpine`; validado no install |
| npm packages (@nestjs/*, rxjs, reflect-metadata, @fastify/multipart, pdfkit, pg, dotenv, @cisne/database → pg+drizzle-orm, @aws-sdk s3) | BUNDLED (imagem/artefato) | lockfile raiz; `pnpm install --frozen-lockfile`; **corrigido**: dotenv/pg promovidos a dependencies (eram devDeps usados em runtime — quebrava `install --prod`) |
| dist compilado (apps/api/dist, packages/database/dist) | BUNDLED | `nest build`/`tsc` |
| Migrations SQL + journal (75 arquivos) | BUNDLED (a partir desta release) | **corrigido**: 0073 fora do journal (drift); BOM em 0070 quebrava migrators; runner hermético `run-migrate-cli.js` adicionado (pg+drizzle-orm apenas) |
| Templates/PDF fonts | BUNDLED | pdfkit usa fontes padrão embutidas; nenhum template externo em runtime |
| Object storage (filesystem/S3-MinIO) | PROVISIONED_AUTOMATICALLY (compose postgres/minio) | provider s3 ou filesystem; credenciais/endpoint via env; validado no startup (s3 exige endpoint+creds) |
| PostgreSQL 18 | PROVISIONED_AUTOMATICALLY (compose) ou HOST_PREREQUISITE (modo host) | saúde via `/api/v1/health/ready`; migrate idempotente via runner do artefato |
| Subprocessos (pg_dump/tar/docker) | OPTIONAL_EXTERNAL_SERVICE (backup/DR) | só em CLIs de backup/DR; zero spawn no grafo API/worker |
| Integrações externas (SEFAZ/bancos/eSocial/WhatsApp/tracking etc.) | OPTIONAL_EXTERNAL_SERVICE | adaptadores estáticos Unconfigured (INTEGRATION_NOT_CONFIGURED) — core inicia sem elas |
| ERP externo | NONE | IntegrationsAclModule liga `UnconfiguredErpProvider`; Dygnus `TEST_ONLY` nunca registrado |
| CDN / download de package em startup | FORBIDDEN (0) | nenhum fetch de pacote em startup; sem CDN no servidor |
| Caminhos absolutos de dev | FORBIDDEN (0) | sem literais `C:\`/home/user no código (corrigido literal em export-split-repos.ps1) |

### Frontend (@cisne/web)

| Dependência | Classe | Evidência / notas |
| --- | --- | --- |
| Bundle JS/CSS (React 19, react-router, lucide) | BUNDLED | dist autocontido |
| Fontes Inter/IBM Plex Mono | BUNDLED (após correção) | **corrigido**: Google Fonts removido do index.html; fontsource self-hosted (mesmas famílias/pesos) |
| nginx estático | PROVISIONED_AUTOMATICALLY | Dockerfile.web runner + compose |
| API do produto | PROVISIONED_AUTOMATICALLY | mesmo deploy; VITE_API_BASE_URL embutido no build |
| Navegador moderno/TLS/DNS | HOST_PREREQUISITE | sem polyfills |
| CDN essencial / analytics | FORBIDDEN (0) | nenhum |

### Banco de dados / migrations / seeds

| Item | Classe | Notas |
| --- | --- | --- |
| 75 migrations SQL | BUNDLED | runner hermético idempotente (verificado 75/75 em DB novo; re-run applied=0) |
| Journal drizzle (meta/_journal.json) | BUNDLED | 75/75 após correção (0073 registrado); spec completa |
| Seeds dev/portfolio/synthetic | FORA do pacote de produção | desenvolvimento/homologação; nunca no startup prod |
| `bootstrap:production` (primeira identidade) | CLI explícita e guardada | só em DB vazio + `BOOTSTRAP_CONFIRM=I_UNDERSTAND` |
| Seed destrutivo em produção | FORBIDDEN (0) | guards `assertDevelopmentOnly`/`assertExternalIntegrationsDisabledForSeed` + allowlist de host/db |

## Correções aplicadas nesta release (rastreáveis)

| # | Correção | Evidência |
| --- | --- | --- |
| 1 | Journal drizzle: migration 0073 registrada (idx 73; 0074→74) | commit `654cdf9`; spec verde |
| 2 | BOM removido de `0070_receivable_collections.sql` | commit seguinte; runner aplica 75/75 |
| 3 | Runner de migrations hermético (`@cisne/database migrate.ts` + CLI) | `dist/cli/run-migrate-cli.js`, sem drizzle-kit |
| 4 | `dotenv`/`pg` como dependencies runtime do @cisne/api | `apps/api/package.json` |
| 5 | Validação fail-fast de config (API+worker) com `CONFIGURATION_ERROR` | `apps/api/src/platform/runtime-config/*` |
| 6 | Removido fallback literal `test-download-token-secret` | `document-storage.config.ts` |
| 7 | Worker `dotenv` path corrigido (off-by-one) | `worker/main.ts` |
| 8 | Frontend: fontes self-hosted; Google Fonts removido | `apps/web/index.html`, `main.tsx`, lockfile |
| 9 | Build web com flavor produção garantido (NODE_ENV pin) | `apps/web/vite.config.ts` |
| 10 | `.dockerignore` raiz (segredos/contexto) | `.dockerignore` |
| 11 | Prod compose: volume PG18 correto, env única, healthchecks | `docker/prod/compose.yaml` |
| 12 | `.env.prod.example` coerente com topologia do compose | `.env.prod.example` |
| 13 | Removido caminho absoluto de dev em export-split-repos.ps1 | `scripts/export-split-repos.ps1` |

## Riscos/gaps residuais registrados (não bloqueiam os gates declarados, mas honestos)

1. `REPORT_GENERATION` sem handler no grafo do worker (falha NO_HANDLER) — débito funcional pré-existente, fora do escopo (sem feature nova).
2. Pollers outbox/inbox ligam por padrão também no processo API — comportamento pré-existente (locking de claim no DB); registrado.
3. Worker carrega fábrica de auth por observabilidade (exige JWT_SECRET mesmo sem servir HTTP) — validado no startup.
4. Export repos (cisne-backend/frontend/infra) defasados — processo de export `split-repos` existe; recomenda-se regenerar antes de publicar separadamente; o deploy de referência usa o monorepo.
5. Primeira release hermética: upgrade binário entre duas versões empacotadas só é plenamente exercitável a partir da segunda release; nesta, o gate UPGRADE valida o caminho de migrations do artefato sobre DB incremental (N−1→N) + preservação de dados (mecanismo entregue para N→N+1 real).
6. TLS entre app e Postgres: compose de referência usa rede interna sem TLS (coerente); PostgreSQL gerenciado/externo deve usar `sslmode=require|verify-*` + `PROD_REQUIRE_DB_TLS=true`.
7. Sem teste de navegador (Playwright) full-stack Finance/Fiscal/Accounting (jsdom + API integration cobrem; débito registrado).
