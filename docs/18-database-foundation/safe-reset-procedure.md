# DB-RESET-001

| Campo       | Valor                |
| ----------- | -------------------- |
| Document ID | Reset seguro (local) |
| Prompt      | 17                   |

## Escopo permitido

Reset **somente** do ambiente Docker local deste repositório:

- Volume: `cisne_local_pg_data`
- Container: `cisne_local_postgres`
- Bancos: `cisne_local_dev`, `cisne_local_test`

## Procedimento

```powershell
pnpm db:reset
```

Equivalente a:

1. `docker compose -f docker/compose.yaml down -v` — remove volume nomeado local
2. `docker compose up -d --wait` — recria cluster vazio
3. `node scripts/wait-for-postgres.mjs`
4. `pnpm db:migrate` — reaplica migrations técnicas

## Proibições

| Ação                                             | Motivo                    |
| ------------------------------------------------ | ------------------------- |
| `DROP DATABASE` em servidor remoto               | Risco destrutivo          |
| Reset sem confirmar volume `cisne_local_pg_data` | Pode apagar dados errados |
| Usar credenciais de produção                     | Violação de segurança     |

## Validação antes do reset

Confirmar:

```powershell
docker volume inspect cisne_local_pg_data
docker ps --filter name=cisne_local_postgres
```

Se o volume ou container **não** corresponder aos nomes acima, **não** executar reset.

## Após reset

- Dados empresariais inexistentes (nenhum foi criado no Prompt 17).
- Baseline técnica recriada pela migration `0000`.
