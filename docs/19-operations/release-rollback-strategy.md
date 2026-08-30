# OPS-RELEASE-001 — Rollback e release safety

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | OPS-RELEASE-001          |
| Prompt      | 91                       |
| Status      | **VALIDATED**            |

## Objetivo

Provar que produção pode voltar a um estado seguro se a nova versão falhar após deploy — executado após piloto tecnicamente aprovado (Prompt 90).

**Classificação:** estratégia de engenharia validada por drill automatizado; go-live completo permanece condicionado a sign-off empresarial (Prompt 89).

## 1. Application rollback (N → N+1 → N)

| Etapa | Comportamento |
| ----- | ------------- |
| Deploy N | Manifest versionado (`cd-manifest`) registrado em histórico |
| Deploy N+1 | Novo commit/build; artifact distinto |
| Falha pós-deploy | Critérios objetivos disparam rollback |
| Rollback | Redeploy do artifact **N** (mesmo digest que versão anterior) |

Implementação: `release-rollback.ts` + `cd-rollback.ts` (`databaseRollbackSupported: false`).

## 2. Database — expand/contract

| Regra | Detalhe |
| ----- | ------- |
| Sem downgrade destrutivo | `databaseRollbackSupported` permanece `false` |
| Janela de rollback | Código N deve sobreviver ao schema deixado por N+1 |
| Migrações breaking | Bloqueadas salvo `allowBreakingMigration` explícito em drill |

Implementação: `release-migration-safety.ts` reutiliza `migration-policy.ts`.

## 3. Feature change — compatibilidade

Mudanças incompatíveis exigem estratégia registrada:

| Estratégia | Controle env |
| ---------- | ------------ |
| `backward_compatible` | nenhum |
| `dual_read_write` | `RELEASE_DUAL_READ_WRITE_ENABLED=true` |
| `feature_flag` | `RELEASE_ROLLBACK_FEATURE_FLAG` |
| `separate_data_migration` | `RELEASE_DATA_MIGRATION_COMPLETED=true` |

Implementação: `release-compat.ts`

## 4. External events — idempotência

Rollback **não pode duplicar**:

- notifications
- ERP sync
- billing
- outbox processing

Chaves idempotentes por canal (`buildExternalEventKey`); replay pós-rollback deve **pular** eventos já processados.

Implementação: `release-idempotency.ts`

## 5. Critérios objetivos de rollback

| Trigger | Condição padrão | Env |
| ------- | --------------- | --- |
| `error_rate` | HTTP error rate > 5% | `RELEASE_MAX_HTTP_ERROR_RATE` |
| `health_failure` | health check não OK | `RELEASE_REQUIRE_HEALTH_OK` |
| `critical_business_failure` | falhas críticas de negócio > 0 | `RELEASE_MAX_CRITICAL_BUSINESS_FAILURES` |

Implementação: `release-decision.ts`

## 6. Drill pós-falha simulada

Validações pós-rollback:

| ID | Domínio |
| -- | ------- |
| `health` | readiness/liveness |
| `data_integrity` | consistência de dados |
| `service_orders` | estados de OS |
| `documents` | artefatos/documentos |
| `worker` | fila worker |
| `outbox` | sem republicação duplicada |
| `billing` | sem documentos duplicados |

Orquestração: `release-drill.ts`

## Comandos

```bash
cp .env.release.example .env.release
pnpm release:drill
pnpm --filter @cisne/api test:release
```

## Relação com CD (Prompt 87)

O drill reutiliza manifest, histórico de deploy e plano de rollback do pipeline CD. Rollback de aplicação = redeploy do manifest N anterior; rollback de banco **não** é assumido.
