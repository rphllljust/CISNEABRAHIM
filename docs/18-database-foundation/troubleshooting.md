# DB-TROUBLE-001

| Campo       | Valor           |
| ----------- | --------------- |
| Document ID | Troubleshooting |
| Prompt      | 17              |

## Docker daemon não está rodando

**Sintoma:** `failed to connect to the docker API at npipe://...`

**Ação:** Iniciar Docker Desktop; aguardar `docker info` responder.

## Container unhealthy (PostgreSQL 18)

**Sintoma:** `container cisne_local_postgres is unhealthy` com mensagem sobre `/var/lib/postgresql/data`.

**Causa:** Imagem PG 18+ exige mount em `/var/lib/postgresql`, não `/var/lib/postgresql/data`.

**Ação:** Usar `docker/compose.yaml` atual; `pnpm db:reset` se volume antigo existir.

## `DATABASE_URL is required`

**Sintoma:** drizzle-kit ou API falham ao migrar.

**Ação:** Copiar `.env.example` → `.env` ou exportar variáveis na sessão.

## `TEST_DATABASE_URL is required` (testes)

**Sintoma:** `database.integration.spec.ts` falha no `beforeAll`.

**Ação:** Subir compose; executar `pnpm db:migrate:test`; definir `TEST_DATABASE_URL`.

## pnpm global EPERM (Windows)

**Sintoma:** `corepack enable` negado.

**Ação:** `npx pnpm@9.15.9 <comando>`.

## Porta 5432 ocupada

**Sintoma:** bind error na porta 5432.

**Ação:** Parar outro PostgreSQL local ou alterar mapeamento em `docker/compose.yaml` (documentar desvio local).

## Migrations já aplicadas

**Sintoma:** drizzle-kit reporta sem pendências.

**Ação:** Normal. Verificar `infrastructure.schema_baseline` com `SELECT * FROM infrastructure.schema_baseline`.

## Integração lenta na primeira conexão

**Ação:** Aguardar health check; usar `pnpm db:wait`.
