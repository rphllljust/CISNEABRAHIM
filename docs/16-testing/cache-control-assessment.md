# QA-CACHE-001 — Avaliação de cache controlado

| Campo       | Valor                                      |
| ----------- | ------------------------------------------ |
| Document ID | Avaliação cache controlado                 |
| Status      | **NOT_REQUIRED**                           |
| Prompt      | 83                                         |
| Evidência   | Prompt 82 smoke benchmarks + gate automatizado |

## Decisão

**Não implementar cache de aplicação neste ciclo.**

Os load tests do Prompt 82 não demonstraram gargalo que justifique cache além das otimizações já aplicadas (search paralelo, índice de listagem de OS, correção SQL).

## Limiar de justificativa (interpretação de engenharia)

| Parâmetro | Valor | Fonte |
| --------- | ----- | ----- |
| `CACHE_JUSTIFICATION_P95_MS` | 500 ms | `cache-decision.ts` — não é SLA empresarial |
| Headroom budgets Prompt 82 | 2.5× | `performance-budgets.ts` |

Nenhum cenário smoke mapeado excedeu 500 ms p95.

## Candidatos avaliados

| Candidato | Cenário benchmark | p95 smoke (ms) | Decisão | Motivo |
| --------- | ----------------- | -------------- | ------- | ------ |
| Catalog reads | — | n/a | **NOT_REQUIRED** | Sem hot path medido; mutações exigem invalidação ampla |
| Static reference data | — | n/a | **NOT_REQUIRED** | Tabelas pequenas, lookups indexados |
| Dashboard aggregates | `dashboard.operational` | ~73 | **NOT_REQUIRED** | Dentro do budget; escopo por identidade; estado operacional mutável |
| Expensive read models (search) | `search.advanced` | ~130 | **NOT_REQUIRED** | Gargalo corrigido em P82 sem cache |

## Superfícies explicitamente não cacheáveis

- Decisões de autorização
- Estado mutável de OS
- Disponibilidade de recursos
- Resultados de comandos financeiros
- Sessão / tokens

## Política hipotética (se futuro p95 > limiar)

Documentada em `buildHypotheticalCachePolicy()` para referência — **não implementada**:

| Uso | Key | TTL | Invalidação | Scope | Falha |
| --- | --- | --- | ----------- | ----- | ----- |
| Dashboard operacional | `dash:op:{identityId}:{scopeHash}` | 30s | TTL + bust em mutações OS | por identidade + hash de grants | fail-open |
| Search | `search:{identityId}:{scopeHash}:{queryHash}` | 60s | TTL | por identidade + escopo + query | fail-open |

Stampede protection: considerar single-flight apenas se p95 > limiar **e** thundering herd observado — não necessário hoje.

## Testes

| Cenário | Status |
| ------- | ------ |
| Gate NOT_REQUIRED com baseline P82 | `cache-decision.spec.ts` |
| Scope key design (hipotético) | `cache-decision.spec.ts` |
| Sem CacheModule no app | `cache-decision.spec.ts` |
| hit / miss / invalidation / stale | N/A — sem implementação |
| scope leakage | N/A — sem implementação |
| cache unavailable | N/A — sem implementação |
| before/after perf | Coberto indiretamente por P82; sem camada cache |

## Reavaliação

Reexecutar gate quando:

1. `PERF_FULL=1` mostrar p95 > 500 ms em candidato read-mostly, **ou**
2. Novo endpoint de agregação entrar em produção com evidência de hot path.

Comando: `pnpm --filter @cisne/api test` inclui `cache-decision.spec.ts`.

## Commit

**Nenhum** commit `perf(cache): add measured application caching` — cache não justificado.
