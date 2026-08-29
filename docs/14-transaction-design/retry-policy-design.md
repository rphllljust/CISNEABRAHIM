# TXN-RETRY-001

| Campo       | Valor             |
| ----------- | ----------------- |
| Document ID | Política de retry |
| Prompt      | 13                |

## Princípio

**Retry não duplica efeito** — só retry quando classificação e idempotência permitem.

## Classificação RETRY (herda transaction-classification)

| Classe                    | Retry automático            | Exemplos           |
| ------------------------- | --------------------------- | ------------------ |
| IDEMPOTENCY_REQUIRED      | Sim (cliente/servidor)      | 001, 017, 020, 021 |
| UNIQUE_BUSINESS_OPERATION | Sim — no-op                 | 003, 005, 010      |
| SAFE_REPEAT               | Sim leitura                 | Consultas          |
| CONFLICT_EXPOSED          | **Não** auto                | 015 REJ-005        |
| FINANCIAL_UNCERTAIN       | **Não** sem consulta estado | 021 pós-timeout    |

## Retry servidor (aplicação)

| Erro                              | Retry?                   | Condição                   |
| --------------------------------- | ------------------------ | -------------------------- |
| Serialization failure (40001)     | Sim                      | Max 3, backoff exponencial |
| Deadlock detected                 | Sim                      | Max 3                      |
| ConcurrencyConflict (row_version) | **Não**                  | Cliente decide             |
| Unique violation idempotente      | Não — retornar existente | —                          |
| Validação negócio REJ             | **Não**                  | —                          |

## Retry cliente HTTP

| Status                           | Ação                        |
| -------------------------------- | --------------------------- |
| 409 Conflict concurrency         | Reload + user action        |
| 409 Conflict idempotency payload | Corrigir payload            |
| 503 + sem commit garantido       | Retry mesma Idempotency-Key |
| 200/201                          | Parar retry                 |

## Timeout ambíguo

| Cenário                      | Procedimento                                             |
| ---------------------------- | -------------------------------------------------------- |
| Timeout após commit          | Retry idempotente → 200 existente                        |
| Timeout antes commit         | Retry idempotente → pode completar ou retornar existente |
| CMD-021 externo desconhecido | **Consultar reconciliação** antes reenviar               |

## Backoff candidato

| Tentativa | Delay |
| --------- | ----- |
| 1         | 50ms  |
| 2         | 150ms |
| 3         | 400ms |

Jitter ±20%. Não aplicar em REJ empresarial.

## Proibições

| Proibido                             | Motivo                              |
| ------------------------------------ | ----------------------------------- |
| Retry cego REJ-005 alocação          | Usuário deve escolher outro recurso |
| Retry infinito                       | Storm                               |
| Retry sem Idempotency-Key em 020/021 | Dup financeiro                      |

## Observabilidade

Métrica: `retry_count`, `idempotency_replay_total` — futuro.
