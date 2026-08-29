# DB-CONN-001

| Campo       | Valor             |
| ----------- | ----------------- |
| Document ID | Gestão de conexão |
| Prompt      | 17                |
| Pacote      | `@cisne/database` |

## Driver e ORM

| Camada | Tecnologia                    |
| ------ | ----------------------------- |
| Pool   | `pg` (`node-postgres`)        |
| ORM    | `drizzle-orm/node-postgres`   |
| NestJS | `DatabaseService` (infra API) |

Domínio **não** importa `drizzle-orm` (ADR-TECH-005 / EP-024).

## Pool padrão

| Opção                     | Default | Env override        |
| ------------------------- | ------- | ------------------- |
| `max`                     | 10      | `DATABASE_POOL_MAX` |
| `idleTimeoutMillis`       | 30000   | —                   |
| `connectionTimeoutMillis` | 5000    | —                   |

Factory: `createDatabase(connectionString)` em `packages/database/src/client.ts`.

## Health check

`checkDatabaseHealth(pool)` executa `SELECT 1` e mede latência.

`GET /health` da API inclui:

```json
{
  "status": "ok | degraded",
  "database": {
    "status": "up | down | not_configured",
    "latencyMs": 0
  }
}
```

- `not_configured` — `DATABASE_URL` ausente (ex.: testes unitários mockados).
- `degraded` — pool configurado mas conexão falhou.

## Ciclo de vida

`DatabaseService` encerra o pool em `onModuleDestroy`.
