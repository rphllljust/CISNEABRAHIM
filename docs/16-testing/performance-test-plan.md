# QA-PERF-001

| Campo | Valor |
| --- | --- |
| Document ID | Plano testes performance |
| Status | **FUTURE** — TARGET_NOT_DEFINED |
| Prompt | 15 |

## Escopo futuro

| Área | Hipótese | Ferramenta |
| --- | --- | --- |
| API p95 latency | < 500ms read OS | k6 |
| Conversão TX throughput | 50 TPS? TBD | k6 |
| Concurrent allocations | sem deadlock | k6 + PG |
| Report BC-016 | heavy query | explain analyze |

## NFR pendentes

NFR-001..004 sem SLA numérico confirmado — **não inventar thresholds**.

## Ambiente

Staging com dados volume sintético — nunca prod.

## Relação concorrência

QA-CONC-001 valida **corretude**; PERF valida **latência** sob carga.

## Gate

PERF não bloqueia MVP; bloqueia scale release quando SLAs definidos.

## PERF-CAND backlog

| ID | Cenário |
| --- | --- |
| PERF-CAND-001 | List 10k OS paginated |
| PERF-CAND-002 | Burst CMD-001 intake |
