# TXN-IDEM-001

| Campo | Valor |
| --- | --- |
| Document ID | Design de idempotência |
| Prompt | 13 |
| Herda | IDEM-REQ-001..005, NFR-011 |

## Objetivo

Reenvio de comando (retry HTTP, duplo clique, integração) **não** produz segundo efeito empresarial.

## Camadas de idempotência

| Camada | Mecanismo |
| --- | --- |
| 1 — API | Header `Idempotency-Key` (UUID) |
| 2 — Aplicação | Tabela `idempotency_record` candidata (não criada) |
| 3 — Domínio | UNIQUE_BUSINESS_OPERATION por invariante |
| 4 — Banco | UNQ-CAND constraints |

## Tabela candidata `app.idempotency_record` (futuro)

| Coluna | Função |
| --- | --- |
| idempotency_key | PK ou UNQ |
| command_type | CMD-00X |
| request_hash | Detectar payload diferente mesma key |
| response_snapshot | Retornar mesma resposta |
| status | IN_PROGRESS / COMPLETED / FAILED |
| expires_at | TTL 24-72h candidato |

**Não implementada** neste prompt.

## Estados idempotência

```text
REQUEST → IN_PROGRESS (insert) → SUCCESS (commit + store response)
                              → CONFLICT (payload hash diff)
                              → FAILED (retry permitido mesma key?)
```

## Regra payload hash

Mesma `Idempotency-Key` + payload diferente → **409 Conflict** — não executar.

## Comandos IDEMPOTENCY_REQUIRED

| CMD | Chave natural |
| --- | --- |
| CMD-001 | idempotency_key |
| CMD-003 | service_request_id |
| CMD-017 | idempotency_key |
| CMD-020 | external_invoice_key |
| CMD-021 | external_payment_ref |

## Comandos UNIQUE_BUSINESS_OPERATION

| CMD | Semântica retry |
| --- | --- |
| CMD-005 | Já liberada → 200 mesmo estado |
| CMD-010 | Já concluída → 200 |
| CMD-015 | Mesma alocação → retorna id existente |

## Integração (IDEM-REQ-004)

Inbox dedup em BC-018 — ver inbox-deduplication-assessment.md.

## Retry não duplica efeito

| Condição | Garantia |
| --- | --- |
| TX rollback | Idempotency IN_PROGRESS expira ou FAILED — retry seguro |
| TX commit | Segunda request retorna resultado armazenado |
| Externo após commit | Outbox + idempotency no consumer |
