# DB-P17-REP-001

| Campo       | Valor               |
| ----------- | ------------------- |
| Document ID | Relatório Prompt 17 |
| Prompt      | 17                  |
| Data        | 2026-08-29          |

## Escopo

PostgreSQL local reproduzível + Drizzle migrations técnicas. Sem tabelas empresariais.

## Entregáveis

| Item                           | Status     |
| ------------------------------ | ---------- |
| `docker/compose.yaml` (PG 18)  | Criado     |
| `@cisne/database` (Drizzle)    | Criado     |
| Migration técnica `0000`       | 1          |
| Health check com DB            | Integrado  |
| Teste integração PG real       | Criado     |
| `docs/18-database-foundation/` | 9 arquivos |

## Quality gate

| Critério                        | Resultado    |
| ------------------------------- | ------------ |
| Compose healthy                 | PASS         |
| PostgreSQL 18.x                 | PASS         |
| Migrations aplicadas (dev+test) | PASS         |
| Business tables                 | 0            |
| Integration test                | PASS         |
| lint / typecheck / test / build | Ver execução |
| Secrets committed               | 0            |
| Prompt 18 não executado         | Sim          |

## Tabelas permitidas pós-migration

| Schema           | Tabela                                       |
| ---------------- | -------------------------------------------- |
| `infrastructure` | `schema_baseline`                            |
| `public`         | `__drizzle_migrations` (journal drizzle-kit) |

## Resultado

```text
PROMPT 17 RESULT: PASS_WITH_RESTRICTIONS
```

Restrições: credenciais locais placeholder em `.env.example`; Docker Desktop deve estar ativo; pnpm via `npx` se global indisponível.
