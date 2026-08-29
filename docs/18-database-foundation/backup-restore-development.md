# DB-BACKUP-001

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Document ID | Backup/restore desenvolvimento |
| Prompt      | 17                             |

## Escopo

Procedimentos **apenas para desenvolvimento local**. Produção não está no escopo deste prompt.

## Backup lógico (dev)

Com PostgreSQL local em execução:

```powershell
docker exec cisne_local_postgres pg_dump -U cisne_local_dev -d cisne_local_dev -Fc -f /tmp/cisne_local_dev.dump
docker cp cisne_local_postgres:/tmp/cisne_local_dev.dump ./tmp/cisne_local_dev.dump
```

Diretório `tmp/` está no `.gitignore`.

## Restore (dev)

```powershell
docker exec -i cisne_local_postgres pg_restore -U cisne_local_dev -d cisne_local_dev --clean --if-exists < tmp/cisne_local_dev.dump
```

## Backup de volume (alternativa)

Parar compose e copiar volume Docker — preferir `pg_dump` para portabilidade.

## Limitações

- Sem política de RPO/RTO (não confirmados).
- Sem backup automatizado — Prompt 28+.
