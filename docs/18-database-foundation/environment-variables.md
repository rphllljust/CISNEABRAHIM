# DB-ENV-001

| Campo       | Valor                 |
| ----------- | --------------------- |
| Document ID | Variáveis de ambiente |
| Prompt      | 17                    |

## Arquivos

| Arquivo        | Commitado | Uso                   |
| -------------- | --------- | --------------------- |
| `.env.example` | Sim       | Template documentado  |
| `.env`         | **Não**   | Valores locais do dev |

`.env` está em `.gitignore`.

## Variáveis

| Variável              | Obrigatória  | Descrição                              |
| --------------------- | ------------ | -------------------------------------- |
| `DATABASE_URL`        | Dev/migrate  | Conexão app + drizzle-kit (dev DB)     |
| `TEST_DATABASE_URL`   | Integração   | Banco `cisne_local_test`               |
| `POSTGRES_USER`       | Compose      | Usuário local (não produção)           |
| `POSTGRES_PASSWORD`   | Compose      | Senha local placeholder                |
| `POSTGRES_DB`         | Compose      | `cisne_local_dev`                      |
| `CISNE_TEST_DB`       | Compose init | Nome do DB de teste                    |
| `DATABASE_POOL_MAX`   | Opcional     | Tamanho do pool (default 10)           |
| `DB_WAIT_ATTEMPTS`    | Opcional     | Tentativas `scripts/wait-for-postgres` |
| `DB_WAIT_INTERVAL_MS` | Opcional     | Intervalo entre tentativas             |

## Exemplo (local)

Ver [`.env.example`](../../.env.example) na raiz.

**Nunca** usar credenciais de produção ou secrets reais no repositório.
