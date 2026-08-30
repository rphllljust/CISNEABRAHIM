# DR-RESTORE-RUNBOOK — Restore isolado

**Regra:** backup não está aprovado até restore comprovado em ambiente descartável.

## Pré-requisitos

- Ambiente **isolado** (nunca produção)
- `DR_DATABASE_URL` ou `TEST_DATABASE_URL` dedicado
- `BACKUP_ENCRYPTION_KEY` (se backups criptografados)
- `pnpm backup:run` executado com sucesso OU artefatos em `BACKUP_DEST_DIR`

## 1. Provisionar ambiente descartável

```powershell
$env:DR_ISOLATED_ROOT = ".backup/dr-drill"
$env:DR_DATABASE_URL = $env:TEST_DATABASE_URL   # ou DB sandbox dedicado
$env:DR_OBJECT_STORAGE_ROOT = ".object-storage-dr"
$env:DR_OBJECT_STORAGE_SOURCE = $env:OBJECT_STORAGE_ROOT   # hidrata objetos referenciados no DB
$env:DR_SCENARIO = "bad_deployment"
New-Item -ItemType Directory -Force -Path $env:DR_OBJECT_STORAGE_ROOT
```

**Bloqueios automáticos:** `NODE_ENV=production` sem `DR_ALLOW_PRODUCTION=I_UNDERSTAND`; URL com `prod`/`production`.

## 2. Executar drill

```bash
pnpm dr:drill
```

Cenários (`DR_SCENARIO`):

| Valor | Simula |
|-------|--------|
| `db_loss` | Perda PostgreSQL |
| `object_storage_partial_loss` | Perda parcial de objetos |
| `bad_deployment` | Rollback completo (default) |
| `application_host_loss` | Só valida config mínima |
| `credential_rotation` | Restore DB + rotação JWT manual pós-restore |

## 3. Verificar resultado

```bash
cat .backup/dr-drill/status/latest.json
```

**PASS** exige:

- `status: "PASS"`
- checks: migration consistency, referential integrity, object storage hydration, document objects, domain smoke, login capability
- sample hashes de object storage conferem com manifest

## 4. Subir aplicação (pós-restore)

```bash
$env:DATABASE_URL = $env:DR_DATABASE_URL
$env:OBJECT_STORAGE_ROOT = $env:DR_OBJECT_STORAGE_ROOT
pnpm --filter @cisne/api dev
```

Smoke manual: login → listar clientes → abrir OS → medição → billing.

## 5. Medição RPO/RTO

Registrado em `metrics` do status JSON:

- `rpoMeasuredMs` — idade do backup no momento do desastre
- `rtoMeasuredMs` — tempo até restore + verificação
- Metas: `TARGET_NOT_DEFINED` (DDP-016) — comparar quando aprovado

## 6. Falha

1. Não apontar app para dados parcialmente restaurados
2. Corrigir causa (artefato, credencial, espaço)
3. Reexecutar `pnpm dr:drill`
4. Backup anterior **não** é aprovado até novo PASS

## Restore manual (sem drill)

```bash
# PostgreSQL
pg_restore -d $DR_DATABASE_URL --clean --if-exists .backup/artifacts/postgres/<ts>/postgres-<ts>.dump.enc

# Object storage — usar pnpm dr:drill ou extrair tar do backup para OBJECT_STORAGE_ROOT
```

Ver `docs/19-operations/backup-strategy.md`.
