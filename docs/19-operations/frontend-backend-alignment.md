# FRONT-BACK-ALIGN-001 — Alinhamento front ↔ API ↔ banco: regras e padrões

| Campo | Valor |
| ----- | ----- |
| Document ID | FRONT-BACK-ALIGN-001 |
| Classificação | Interpretação de engenharia (padrões e regras técnicas; não altera regras de negócio) |
| Evidência | Diagnóstico do ambiente HML 2026-09-04 (imagens 5 dias antigas; DB HML 72/75; 404 em módulos novos na API antiga; 403 por grants; flags FEATURE_MODULE_* ausentes no backend HML) |

## 1. Modelo de alinhamento por ambiente (fonte única)

Cada ambiente (development, hml, pilot, production) deve ter **um único contrato de
alinhamento** que define, para a MESMA versão de código:

| Camada | O que precisa estar alinhado |
| --- | --- |
| Imagens/containers | `api`, `web`, `worker` construídos do mesmo `commitSha` |
| Migrations | banco do ambiente aplicado até o `idx` esperado pelo código (igual ao `meta/_journal.json` do commit) |
| Runtime env (API) | `FEATURE_MODULE_*`, `CISNE_ENV`, URLs, secrets — de `env.<ambiente>` |
| Build env (web) | `VITE_API_BASE_URL`, `VITE_FEATURE_MODULE_*` — de `env.<ambiente>` |
| Dados | a UI lê apenas o banco do ambiente onde está publicada |

**Regra R1 (paridade de flags).** O conjunto `FEATURE_MODULE_*` usado no build do
frontend (`VITE_FEATURE_MODULE_*`) deve ser **idêntico** ao do backend no mesmo
ambiente. Frontend e backend são fail-closed (feature off = rota/escondida). Se
divergirem, uma tela aparece e o backend responde `403 FEATURE_DISABLED`, ou vice-versa.
Ferramenta de checagem: `scripts/stack/check-alignment.mjs` (comparar dist web × env API × journal de migrations).

**Regra R2 (deploy atômico de schema).** Migrations do ambiente são aplicadas **antes**
de subir a nova API, a partir do artefato/commit da mesma release (runner hermético
`run-migrate-cli.js`), nunca manualmente em outro banco. Depois do deploy, o runbook
valida `health/ready` + contagem de migrations == esperada.

**Regra R3 (nenhum dado visível de outro ambiente).** A UI fala com a API do seu
ambiente (URL fixada no build). Dados criados em outro banco **não** aparecem; para
ver, usar o seed oficial do ambiente ou apontar o build para esse ambiente.

## 2. Padrões de UI para refletir backend/banco fielmente

**P1 — Toda mutação → refresh da origem.** Após `create/update/delete` bem-sucedido
(com o payload de volta do servidor), a página deve **recarregar a lista/entidade**
da API (mesmo padrão já usado em módulos existentes: `load()` após sucesso), nunca
reutilizar estado local como verdade.

**P2 — Estados honestos (nunca "falso vazio").** Tela de lista deve distinguir:
- `200 []` → vazio real (mensagem "Nenhum registro");
- `403` → acesso negado (mostrar bloqueio, não lista vazia);
- `404`/rota inexistente → **indisponibilidade de versão** (API antiga sem o módulo) —
  sinalizar "módulo não suportado pela API deste ambiente";
- `>=500` → erro, com retry.
O envelope de erro `{error:{code,message}}` já é o padrão do repo (Round 1) — manter.

**P3 — Sem espelho de dados.** O frontend **nunca** deve exibir valor de banco que não
tenha vindo da API no request atual (sem cache persistente entre sessões para listas
de negócio; exceções: catálogo estático com etiqueta "cache").

## 3. Padrões de backend para "o dado existir e ser entregável"

**P4 — Módulo registrado e gated de forma coerente.** Se um módulo tem tabelas/migrations
no commit, a API do ambiente deve expô-lo (controllers) OU o flag correspondente deve
estar desligado também no front — nunca controller presente só num ambiente e ausente
noutro (404 silencioso é o pior estado).

**P5 — Visibilidade exige grant.** Lista protegida por PDP: dado existente + sem grant
= `403`, não vazio. Operador de demonstração deve receber grants via mecanismo oficial
(access-admin / bootstrap de perfil), nunca via "liberar tudo no código".

**P6 — Diagnóstico de alinhamento disponível.** `scripts/stack/check-alignment.mjs`
imprime: commit das imagens × HEAD, migrations aplicadas × esperadas, flags web × API,
base URL da UI × API do ambiente. Rodar antes de "não está refletindo" (runbook).

## 4. Runbook curto (diagnóstico de "não reflete")
1. `node scripts/stack/check-alignment.mjs --env hml` → ver deriva.
2. Conferir banco: `SELECT count(*) FROM drizzle.__drizzle_migrations` no DB da UI.
3. Conferir módulo: chamar rota com token → 200 (dados), 403 (grant), 404 (API antiga).
4. Corrigir: redeploy do ambiente com a mesma release + migrations + flags iguais
   (R2), depois `refresh` no navegador (P1/P2).
