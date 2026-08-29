# QA-FLAKY-001

| Campo       | Valor                 |
| ----------- | --------------------- |
| Document ID | Política testes flaky |
| Prompt      | 15                    |

## Definição

Teste que passa/falha sem mudança de código — intermitente.

## Causas comuns neste projeto

| Causa               | Mitigação                               |
| ------------------- | --------------------------------------- |
| Race timing         | `waitFor` assert; aumentar timeout race |
| Shared DB state     | transaction rollback; unique schema     |
| Clock dependency    | inject fake timers                      |
| Port collision      | dynamic ports testcontainers            |
| Parallel race tests | tag `@concurrency` serial job           |

## Política

| Regra                  | Ação                                             |
| ---------------------- | ------------------------------------------------ |
| Flaky detectado 3×     | Quarantine `@flaky` + issue                      |
| Retry CI               | Max 2 apenas integration; **não** em concurrency |
| Skip permanente        | **Proibido** sem issue + prazo fix               |
| Flaky em gate CRITICAL | Blocker — fix antes merge                        |

## Métricas

Track flaky rate por TEST-CAND — dashboard CI candidato.

## Concorrência

TEST-CAND 003,006,009,020 — se flaky, rodar job `test:concurrency` isolado sequencial.

## Não mascarar bug

Retry infinito esconde lost update — proibido em TEST-CAND 006.
