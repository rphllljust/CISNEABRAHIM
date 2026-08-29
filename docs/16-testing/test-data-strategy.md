# QA-DATA-001

| Campo       | Valor                     |
| ----------- | ------------------------- |
| Document ID | Estratégia dados de teste |
| Prompt      | 15                        |

## Regras

| #   | Regra                                                                       |
| --- | --------------------------------------------------------------------------- |
| 1   | **Sem dados reais** — CPF, NF, cliente, valores contratuais reais proibidos |
| 2   | UUID v7/v4 sintéticos para ids                                              |
| 3   | Nomes `Fixture Party A`, `Test OS 001`                                      |
| 4   | Money amounts arbitrários `100.00 BRL`                                      |
| 5   | external_invoice_key prefix `TEST-NF-`                                      |
| 6   | Não copiar backup prod para CI                                              |

## Factories candidatas (futuro)

| Factory                              | Cria             |
| ------------------------------------ | ---------------- |
| `createParty()`                      | pty.party        |
| `createServiceRequest()`             | sr + idempotency |
| `createServiceOrderReleased()`       | OS LIBERADA      |
| `createActorWithRole(ROLE-CAND-002)` | token test       |

## Seeds

Prompt 19 — seeds **não** são verdade empresarial; apenas fixtures dev.

## Anonimização

Se necessário dados shape-real → Faker com locale; sem documentos gov reais.

## Cleanup

Truncate schema ou transaction rollback per test — isolamento.

## PII em logs test

Assert redaction — mesmo em ambiente test.

## SEC-RISK-010

Backup prod em dev — **proibido** em política QA.
