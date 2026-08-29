# QA-IDEM-001

| Campo | Valor |
| --- | --- |
| Document ID | Testes idempotência |
| Prompt | 15 |

## Comandos IDEMPOTENCY_REQUIRED

| CMD | TEST-CAND | Cenários |
| --- | --- | --- |
| CMD-001 | 036 | mesma idempotency_key → 1 SR |
| CMD-003 | 002 | retry após 503 → mesma OS id |
| CMD-017 | 017 | dup submit → mesma medição ou REJ |
| CMD-020 | 011 | mesma external_invoice_key |
| CMD-021 | 012,049 | mesma payment ref; timeout retry |

## UNIQUE_BUSINESS_OPERATION

| CMD | TEST-CAND |
| --- | --- |
| CMD-005 | 010 |
| CMD-010 | backlog 059 |
| CMD-015 | 019 |

## Header

`Idempotency-Key: uuid` — repetir request idêntico → mesmo status+body.

## Payload hash conflict

Mesma key, body diferente → **409** — TEST backlog 060.

## Inbox dedup

TEST-CAND-046 — 2× webhook mesmo message_id.

## Nível

L4 API + L3 UNQ — ambos para financeiro.

## Gate

INV-010, INV-011, INV-003 — idempotency tests mandatory CI.
