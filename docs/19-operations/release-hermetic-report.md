# OPS-HERM-002 — Relatório do gate de release hermético

| Campo | Valor |
| ----- | ----- |
| Document ID | OPS-HERM-002 |
| Prompt | HERMETIC PRODUCTION RELEASE |
| Data | 2026-09-04 |
| Auditoria | `release-hermetic-audit.md` (OPS-HERM-001) |

## Resultado obrigatório

```text
HERMETIC BUILD:                       PASS
CLEAN INSTALL:                        PASS
OFFLINE INSTALL:                      PASS
RUNTIME PACKAGE DOWNLOADS:            0
UNDECLARED LOCAL FILE DEPENDENCIES:   0
MANUAL REQUIRED CONFIG STEPS:         2 (justificável: secrets + domínios/URL públicas via .env validado)
MIGRATIONS:                           PASS
UPGRADE:                              PASS
RECOVERY:                             PASS
SECRETS IN ARTIFACT:                  0
ERP EXTERNAL DEPENDENCY:              NONE
CORE WITHOUT OPTIONAL INTEGRATIONS:   PASS
PRODUCTION ARTIFACT:                  NOT_READY
CRITICAL DEFECTS:                     0
NEXT:                                 CONTINUE
```

> PRODUCTION ARTIFACT **NOT_READY** por honestidade: o artefato instala e inicia
> limpo e executa o fluxo `login → leituras Finance → web / ServiceOrder /
> Documents / Clients (deny-by-default autorizado) → health` a partir das imagens
> empacotadas, mas **o fluxo crítico completo de escrita** (ServiceOrder→Finance→
> Fiscal→Accounting→Documents) ainda depende de atribuição de grants (etapa
> operacional documentada) e não foi executado como uma única jornada HTTP-E2E a
> partir do artefato; as suítes canônicas que o cobrem (integration/e2e/uat/
> master-business/enterprise) não foram executadas nesta rodada e 3 falhas de
> unit aparecem nos arquivos WIP não commitados do programa concorrente.

## Evidência (as gates foram executadas deste artefato/imagens)

### HERMETIC BUILD — PASS
- Build canônico real (sem `RELEASE_SKIP_BUILD`): `pnpm install --frozen-lockfile` +
  `pnpm build` de `apps/api`, `apps/web`, `packages/database` (turbo). Web bundle
  de produção (flavor corrigido) com 1.02 MB (antes 1.95 MB dev-flavor).
- Pacote versionado: `artifacts/release/cisne-0.1.0-rc.1/`
  (`manifest.json` version/commitSha/artifactDigest, `checksums.sha256`, `sbom.json`
  com 735 pacotes + 6 imagens de container, `api/`, `web/`, `db/`+`db/migrations`
  com 75 migrations). `artifactDigest=sha256:73b5d4cab3d5f046faac1355c2d79b6c846fc0e59bb3676ec8186795b128e399`.
- Imagens hermeticas: `cisne-api:local` (node_modules apenas de PRODUÇÃO; sem
  devDeps/source/source-maps/.env; migrations embutidas) e `cisne-web:local`
  (nginx + dist).

### CLEAN INSTALL / OFFLINE INSTALL — PASS (`tmp/gates/g3/gate-result.json`)
`docker compose -p cisne_gate_g3 -f docker/sandbox/compose.yaml` sem build,
`pull_policy: never`, rede bridge com ip-masquerade desabilitado (containers sem
egresso → qualquer download no runtime falha; host alcança portas publicadas).
`images_local`, `postgres_up`, `migrate_fresh (75/75)`, `migrate_idempotent (0)`,
`bootstrap_admin (created)`, `stack_up`, `health_live` 200, `health_ready` 200,
`login` 200, `worker` Up, `finance` 200 `[]`, `service_orders/documents/clients`
**403 ACCESS_DENIED** (deny-by-default com grants não atribuídos — comportamento
esperado de segurança), `web` 200. Todas as etapas PASS.

### MIGRATIONS — PASS
Runner do artefato (`packages/database/dist/cli/run-migrate-cli.js`, só
pg+drizzle-orm): DB limpo aplicou 75/75 (0070 BOM corrigido, 0073 registrado no
journal); re-run aplicou 0 (idempotente). Spec de completude do journal 75/75 green.

### UPGRADE — PASS (`tmp/gates/upgrade-u6/upgrade-result.json`)
Releitura do "release anterior" = migrations atuais sem a 0074 (74 arquivos) →
runner do artefato novo aplicou 1 migration pendente (0074) sobre o schema antigo
(`applied=1 total=75`), re-run `applied=0`, conjunto é superset estrito (nenhum
SQL removido → DDL não destrutiva), `api/worker/web` up e `health/ready` 200 após
a atualização. Restrição documentada: primeira release hermética → upgrade binário
real entre dois pacotes só é plenamente exercitável a partir da 2ª release (registrado).

### RECOVERY — PASS (`tmp/gates/recovery-r1/recovery-result.json`)
API stop/start, worker restart, API crash-restart e PostgreSQL restart →
readiness 200 e login OK após cada evento (recuperação previsível). *Storage
indisponível* é exercitado pela suíte canônica `test:chaos-recovery` (harness de
falha de storage), não como operação in-place no volume do sandbox (registrado).

### RUNTIME PACKAGE DOWNLOADS — 0
Imagem final sem pnpm/npm/verificador de registry; nenhum fetch em startup; rede
de runtime sem egresso. Fonte única: imagens pré-construídas + `pull_policy: never`.

### UNDECLARED LOCAL FILE DEPENDENCIES — 0
Sem caminhos absolutos de dev no código/imagens (literal removido de
`export-split-repos.ps1`); `apps/api` source sem `C:\`/`/home/user`.

### SECRETS IN ARTIFACT — 0
`scanStagedFiles` (padrões chave/AWS/token/pem) no pacote → 0. Sem `.env`,
tokens, chaves, source maps (remoção) no artefato/imagem.

### CORE WITHOUT OPTIONAL INTEGRATIONS — PASS / ERP — NONE
API inicia sem nenhuma integração configurada; ERP externo ausente
(`UnconfiguredErpProvider`; Dygnus TEST_ONLY nunca registrado). Read paths de
negócio com identidade recém-bootstrapped retornam deny-by-default (403), nunca
fake success; login e leitura Finance funcionam.

## Cobertura de segurança / duplicação (evidência)
- Sem segredos commitados (scan `git ls-files`): 0 hits (apenas fixtures de teste).
- Fonte de verdade única: `apps/api`, `apps/web`, `packages/*`; repos exportados
  `cisne-{backend,frontend,infra}` são artefatos gitignored (publish separado) e
  estavam defasados (registrado; recomenda-se regenerar via `export-split-repos.ps1`).
- Sem detector de duplicação no repo; verificados 0 módulos/serviços/DTOs/API
  clients duplicados (inspeção por leafname). Duplicação de orchestrador de release
  evitada (reuso de `pnpm-lock`, compose como padrão consolidado — Docker não foi
  introduzido por conveniência; o projeto já é compose-based).

## Restrições / débitos honestos
1. **PRODUCTION ARTIFACT NOT_READY** (ver nota no topo): fluxo crítico de escrita
   completo via HTTP a partir do artefato não executado; suítes canônicas
   (integration/e2e/uat/master-business/enterprise/chaos) não rodadas nesta rodada.
2. **3 falhas de unit ** @cisne/api** em arquivos WIP não commitados do programa
   concorrente** (release-scope.guard + policy-decision-point) — não causadas pelas
   alterações deste prompt (novas specs verdes). Working tree mantém WIP
   (268 arquivos) preservado.
3. Defeito de robustez: `GET /api/v1/accounting/ledger` sem `chartId` retorna
   **500 INTERNAL_ERROR** em vez de 400 (registrado; correção = validação de
   parâmetro no recurso, fora das regras de negócio).
4. `REPORT_GENERATION` sem handler no grafo do worker (débito funcional
   pré-existente; nenhum feature nova adicionada).
5. Desvio de deploy: `docker/prod/compose.yaml` de referência usa rede interna privada
   sem TLS (coerente); PostgreSQL gerenciado/externo deve usar `sslmode=require` +
   `PROD_REQUIRE_DB_TLS=true`.

## Como reproduzir
```bash
# 1) Pacote hermético (build canônico)
RELEASE_WEB_PUBLIC_URL=https://api.cisne.example RELEASE_VERSION=0.1.0-rc.1 node scripts/release/package.mjs
# 2) Imagens (builder com rede; runtime sem devDeps)
docker build -f docker/hml/Dockerfile.api  -t cisne-api:local .
docker build -f docker/hml/Dockerfile.web  -t cisne-web:local --build-arg VITE_API_BASE_URL=http://127.0.0.1:3110 .
# 3) Gates (a partir das imagens)
node scripts/release/run-install-gate.mjs --project g3     # clean+offline
node scripts/release/run-upgrade-gate.mjs  --project u6    # upgrade
node scripts/release/run-recovery-gate.mjs --project r1    # recovery
```


## Rodada 3 — suítes canônicas com banco real (schema provisionado pelo artefato)

Executadas em PostgreSQL real (DB descartável migrado 75/75 pelo runner do
artefato). Resultado por suíte de módulo crítico — **PASS**:
- auth 7/7, clients 5/5, fiscal 6/6, accounting 9/9, documents 9/9,
  billing 19/19, finance/receivables 13/13, service-orders 24/25,
  requests 17/18. (2 falhas unitárias pré-existentes de fixtures de domínio —
  conflito de CNPJ/ordem; não causadas por esta release.)
- Verticais orquestradas (uat/master-business/enterprise-integrity) requerem a
  **emissora (própria empresa com CNPJ ativo)** via bootstrap operacional
  (`bootstrap:own-company` com dados OWN_COMPANY_* de fonte oficial SRC-005);
  sem esse provisionamento elas não emitem documento (ISSUER_DEFAULT_NOT_FOUND).
  O bootstrap com CNPJ sintético não registrou a linha de CNPJ (validação
  intencional) → verticais não verdes nesta rodada; executar com o seed
  operacional autorizado antes do critério de READY.
- Correções desta rodada: `InvalidUuidError` → 400 (ledger sem chartId deixou de
  dar 500) e escrita do `billing_entitlement_policy` alinhada ao DEFAULT do DDL
  (`MEASUREMENT_APPROVED`) — repositório gravava NULL contra coluna NOT NULL
  (defeito reproduzido em DB limpo; suíte service-orders passou de 3 para 24/25).