# OPS-PILOT-001 — Piloto controlado

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | OPS-PILOT-001            |
| Prompt      | 90                       |
| Status      | **ACTIVE**               |

## Objetivo

Validar o software com operação **limitada** antes do go-live completo — após UAT engenharia **APPROVED** (Prompt 89).

**Classificação:** aceite empresarial permanece `PENDING`; piloto não substitui sign-off de negócio.

## Escopo limitado

| Controle | Padrão | Env |
| -------- | ------ | --- |
| Usuários | 5 | `PILOT_MAX_USERS` |
| OS ativas | 10 | `PILOT_MAX_ACTIVE_SERVICE_ORDERS` |
| Volume semanal | 15 | `PILOT_VOLUME_CAP_PER_WEEK` |
| Serviços | RENTAL, TRANSPORT, CIVIL_WORK (UAT 89) | `PILOT_ALLOWED_ARCHETYPES` |
| Unidades | lista fechada | `PILOT_ALLOWED_UNIT_IDS` |

**Proibido:** `PILOT_MIGRATE_ALL_LEGACY_DATA=true` — não migrar toda operação de uma vez.

## Feature flags

Sem framework de flags. Somente env gates quando `PILOT_INFRA_EXTENDED=true`:

| Flag | Env |
| ---- | --- |
| Serviços estendidos | `PILOT_FLAG_EXTENDED_SERVICES` |
| Integrações externas (ACL adapters confirmados) | `PILOT_FLAG_EXTERNAL_INTEGRATIONS` |

Implementação: `pilot-flags.ts`

## Observação durante piloto

| Sinal | Fonte |
| ----- | ----- |
| errors / latency | métricas HTTP (`MetricsRegistryService`) |
| DB | taxa de erro + pool waiting |
| worker / outbox | `PlatformMetricsCollectorService` backlogs |
| OS overdue | `BusinessMetricsCollectorService` |
| allocation conflicts | query overlap `res.resource_allocations` |
| user support | `PILOT_FEEDBACK_FILE` |
| billing discrepancies | billing aging + feedback categoria `bug` |

Snapshot: `pilot-observation.ts` + `runPilotStatusCheck`

## Feedback (não misturar categorias)

| Categoria | Uso |
| --------- | --- |
| `bug` | defeito corrigível |
| `ux_improvement` | clareza/fluxo sem mudar regra |
| `new_feature` | capacidade nova — **fora** do piloto salvo aprovação |
| `business_rule_change` | regra de domínio — requer redesign/registro |

Severidade: BLOCKER | CRITICAL | MAJOR | MINOR — `pilot-feedback.ts`

## Critérios de saída

Piloto só encerra (`EXIT_READY`) quando:

1. Janela mínima (`PILOT_MIN_OBSERVATION_DAYS`, padrão 14)
2. Sem BLOCKER/CRITICAL abertos
3. Thresholds de erro/latência/worker/billing/allocation atendidos

Fases: `ACTIVE` → `EXIT_READY` | `BLOCKED`

## Comandos

```bash
cp .env.pilot.example .env.pilot
pnpm pilot:status
pnpm --filter @cisne/api test:pilot
```

## Correções durante piloto

Commit **somente** para correções reais de defeito aprovado — sem novas funcionalidades.

## Documentos relacionados

- [uat-business-scenarios.md](../16-testing/uat-business-scenarios.md)
- [production-infrastructure.md](./production-infrastructure.md)
