# OPS-BACKUP-001 — Estratégia de backup monitorado

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Document ID | OPS-BACKUP-001                 |
| Prompt      | 84                             |
| Status      | IMPLEMENTED (engenharia)       |

## RPO / RTO — bloqueador de produção

| Item   | Status               | Fonte    |
| ------ | -------------------- | -------- |
| RPO    | `TARGET_NOT_DEFINED` | DDP-016  |
| RTO    | `TARGET_NOT_DEFINED` | DDP-016  |
| Go-live formal | **BLOQUEADO** até aprovação empresarial | NFR-027, NFR-028 |

**Classificação:** decisão pendente — não inventar valores comerciais.

O job de backup pode executar e gerar artefatos recuperáveis; validação de SLA de continuidade permanece pendente.

## PostgreSQL

| Camada            | Estratégia |
| ----------------- | ---------- |
| Dev/local         | Backup lógico `pg_dump -Fc` via `pnpm backup:run` |
| Docker local      | `BACKUP_POSTGRES_MODE=docker` (container `cisne_local_postgres`) |
| Produção (futuro) | Base/full backup + WAL/PITR quando infra gerenciada suportar (RDS, Cloud SQL, etc.) |
| Retenção          | `BACKUP_RETENTION_DAILY` (padrão 7) — **retenção de engenharia**, não legal |
| Criptografia      | AES-256-GCM via `BACKUP_ENCRYPTION_KEY` (32 bytes base64, credencial separada) |
| Off-site          | `BACKUP_OFFSITE_DIR` ou replicação de bucket |

Chave de criptografia **nunca** é gravada junto do artefato.

## Object storage (documentos, evidências, billing PDFs)

| Controle | Implementação |
| -------- | ------------- |
| Backup   | Snapshot + manifest SHA-256 + arquivo tar (`.tar` ou `.tar.enc`) |
| Versioning | Habilitar no provedor S3-compatible em produção |
| Replication | Cross-region / second bucket via infra |
| Retenção backup | `BACKUP_RETENTION_DAILY` — separado de retenção legal (DDP-019) |
| Retenção legal | `TARGET_NOT_DEFINED` — validação empresarial/legal pendente |

## Segurança

- Credencial de backup separada da aplicação (`BACKUP_ENCRYPTION_KEY`, role `pg_dump` mínima).
- Acesso mínimo ao destino e off-site.
- Admin técnico: backup criptografado; leitura empresarial de RESTRITO segue ADP-007.

## Monitoramento

Job escreve `BACKUP_STATUS_FILE` (padrão `.backup/status/latest.json`) com:

- `status` (`ok` | `failed`)
- `durationMs`
- `sizeBytes`
- `artifactCount`
- `checkedAt` / timestamps
- `artifacts[]` com `sha256`

`PlatformMetricsCollectorService` lê o arquivo; falha dispara alerta técnico imediato (Prompt 80).

Variáveis legadas ainda suportadas: `TECH_BACKUP_LAST_STATUS`, `TECH_BACKUP_LAST_CHECKED_AT`, etc.

## Execução

```bash
pnpm backup:run
```

Variáveis principais — ver `.env.example` seção Backup.

## Testes

| Cenário | Evidência |
| ------- | --------- |
| Backup executado | `backup.integration.spec.ts` |
| Artefato válido (PGDMP / tar) | `backup.integration.spec.ts` |
| Storage acessível | `backup.integration.spec.ts` |
| Checksum / criptografia | `backup-crypto.spec.ts` |
| Falha registra status | `backup.integration.spec.ts` |
| Scope leakage N/A | backup não compartilha respostas HTTP |
| Falha dispara alerta | `technical-alert.engine.spec.ts` (Prompt 80) |

## Fail-open / fail-closed

| Uso | Comportamento |
| --- | ------------- |
| Falha do job de backup | `failed` + alerta; aplicação continua (backup é otimização de DR, não runtime) |
| Leitura de status ausente | `unknown` — não derruba API |
| Restore | Fail-closed — exige validação manual e ambiente isolado (SEC-THR-029) |
