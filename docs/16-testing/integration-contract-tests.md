# QA-CONTRACT-001

| Campo       | Valor                      |
| ----------- | -------------------------- |
| Document ID | Testes contrato integração |
| Prompt      | 15                         |

## API OpenAPI

| Contrato             | Teste candidato                    | Nível |
| -------------------- | ---------------------------------- | ----- |
| Request schema CMD-* | Snapshot Zod ↔ OpenAPI             | L4    |
| Response 403 shape   | DENY genérico                      | L4    |
| Pagination list OS   | schema estável                     | L4    |
| Error envelope       | `{ code, message, correlationId }` | L4    |

## Webhook inbox (BC-018)

| Contrato                 | TEST-CAND |
| ------------------------ | --------- |
| HMAC header required     | 045       |
| Schema payment event     | 046       |
| Unknown event type → 400 | backlog   |
| Idempotent ACK 200 dup   | 046       |

## ERP outbound (futuro)

| Contrato             | Abordagem            |
| -------------------- | -------------------- |
| Pact consumer-driven | CANDIDATE — TECH-DDP |
| Wire mock recordings | Staging only         |

## IdP OIDC

| Contrato        | Teste |
| --------------- | ----- |
| JWKS validation | 047   |
| Expired token   | 047   |

## Não confiar contrato externo

INV-016 — validação local mesmo com schema válido (TEST-CAND-044).

## Versionamento

Breaking API → contract test fail + major version bump.
