# DB-LOCAL-001

| Campo       | Valor            |
| ----------- | ---------------- |
| Document ID | PostgreSQL local |
| Prompt      | 17               |
| ADR         | ADR-TECH-004     |

## Imagem e versão

| Item    | Valor                              |
| ------- | ---------------------------------- |
| Imagem  | `postgres:18-alpine`               |
| Versão  | PostgreSQL **18.x** (ADR-TECH-004) |
| Compose | `docker/compose.yaml`              |

## Rede e exposição

- Porta **5432** publicada somente em `127.0.0.1` (não exposto à rede pública).
- Container: `cisne_local_postgres`.
- Volume nomeado: `cisne_local_pg_data` montado em `/var/lib/postgresql` (layout exigido pelo image PG 18+).

## Bancos

| Banco              | Uso                          |
| ------------------ | ---------------------------- |
| `cisne_local_dev`  | Desenvolvimento / migrations |
| `cisne_local_test` | Testes de integração         |

Nomes específicos do projeto — **não** usar `production`, `app` genérico ou credenciais reutilizáveis.

## Credenciais locais

Definidas em `.env.example` (placeholders). **Não** commitar `.env`.

## Health check (Compose)

```yaml
pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Intervalo 5s; container deve ficar `healthy` antes de migrations.

## Comandos

```powershell
pnpm db:up      # sobe e aguarda healthy
pnpm db:down    # para containers (mantém volume)
pnpm db:wait    # aguarda conexão via DATABASE_URL
pnpm db:migrate # dev + test
pnpm db:reset   # APENAS volume local cisne_local_pg_data
```

## Inicialização do banco de teste

Script `docker/postgres/init/01-create-test-database.sh` cria `cisne_local_test` na primeira inicialização do volume.
