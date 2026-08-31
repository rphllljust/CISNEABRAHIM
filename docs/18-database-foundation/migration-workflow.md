# DB-MIG-001

| Campo       | Valor               |
| ----------- | ------------------- |
| Document ID | Fluxo de migrations |
| Prompt      | 17                  |
| Ferramenta  | drizzle-kit ≥0.31.7 |

## Layout

```text
packages/database/
├── drizzle.config.ts
├── src/schema/          # somente schema técnico (infrastructure)
└── migrations/          # SQL versionado
```

## Comandos

| Comando                | Ação                                             |
| ---------------------- | ------------------------------------------------ |
| `pnpm db:generate`     | `drizzle-kit generate` (após alterar schema)     |
| `pnpm db:migrate`      | Aplica em `cisne_local_dev` e `cisne_local_test` |
| `pnpm db:migrate:dev`  | Somente dev DB                                   |
| `pnpm db:migrate:test` | Somente test DB (via script Node)                |

Pré-requisito: PostgreSQL healthy + `DATABASE_URL` / `TEST_DATABASE_URL` definidos.

## Migrations técnicas (Prompt 17)

| Arquivo                        | Conteúdo                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| `0000_early_thaddeus_ross.sql` | Schema `infrastructure`, tabela `schema_baseline`, seed técnica |

**Total migrations empresariais: 0**

## Regras

1. Tabelas de domínio entram em prompts posteriores com schema por módulo.
2. Usar `drizzle-kit generate` — não editar SQL manualmente exceto seeds técnicos documentados.
3. drizzle-kit **≥ 0.31.7** obrigatório para PostgreSQL 18 (bug DROP em versões anteriores).

## Journal

Metadados em `migrations/meta/_journal.json` e snapshots.

**Estado atual (pós-implementação):** cada arquivo `NNNN_*.sql` em `packages/database/migrations/` deve ter entrada correspondente no journal, com `idx` sequencial. Isso é validado por `packages/database/src/migration-journal-completeness.spec.ts`. O gate `pnpm gate:database` aplica a lista de SQL no disco (não uma lista hardcoded).

`schemaFilter` em `drizzle.config.ts` permanece `infrastructure` + `identity` de propósito: snapshots 0000/0001 não cobrem o domínio; alargar o filtro faria `db:generate` reemitir CREATE das tabelas já versionadas em 0002–0037.

Em banco já existente, `pnpm db:migrate:test` reconcilia hashes (`syncDrizzleJournal`) antes de aplicar SQL pendente — não marca como aplicada uma migration de domínio cujo artefato ainda não existe.
