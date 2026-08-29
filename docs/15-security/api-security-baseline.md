# SEC-API-001

| Campo           | Valor                  |
| --------------- | ---------------------- |
| Document ID     | Baseline segurança API |
| Stack candidata | NestJS 11 + Fastify    |
| Prompt          | 14                     |

## Transporte

| Controle | Valor                          |
| -------- | ------------------------------ |
| TLS      | Obrigatório prod (SEC-REQ-023) |
| HSTS     | max-age ≥ 1 ano prod           |
| HTTP     | Redirect 301 → HTTPS           |

## Headers de segurança (candidato)

| Header                      | Valor                               |
| --------------------------- | ----------------------------------- |
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains |
| `X-Content-Type-Options`    | nosniff                             |
| `X-Frame-Options`           | DENY ou CSP frame-ancestors         |
| `Content-Security-Policy`   | default-src 'self' — ajustar UI     |
| `Referrer-Policy`           | strict-origin-when-cross-origin     |
| `Permissions-Policy`        | restritivo                          |
| `Cache-Control`             | no-store em endpoints sensíveis     |

## CORS

| Ambiente | Política                                               |
| -------- | ------------------------------------------------------ |
| Prod     | Whitelist origens conhecidas — não `*` com credentials |
| Dev      | Localhost explícito                                    |

Credentials: `Access-Control-Allow-Credentials: true` só com origem fixa.

## CSRF

| Modelo API     | CSRF                                     |
| -------------- | ---------------------------------------- |
| Bearer JWT SPA | CSRF baixo — SameSite + não cookie auth  |
| Cookie session | **Obrigatório** CSRF token double-submit |

SEC-DEC-004: API primária JWT bearer — CSRF mitigado; validar se cookie adotado.

## Rate limiting (candidato)

| Endpoint        | Limite candidato |
| --------------- | ---------------- |
| Login           | 5/min/IP         |
| API autenticada | 100–300/min/user |
| Export sensível | 10/h/user        |
| Upload          | 20/h/user        |

SEC-CTL-006, SEC-CTL-030 — implementação Prompt 16+.

## Versionamento API

`/api/v1/` — breaking auth changes major version.

## Idempotency

Header `Idempotency-Key` em POST financeiros — TXN Prompt 13.

## Erro

| Código | Corpo                                    |
| ------ | ---------------------------------------- |
| 401    | Genérico                                 |
| 403    | Sem revelar recurso existe (SEC-REQ-015) |
| 404    | IDOR — mesmo shape 403 vs 404 policy TBD |

## OpenAPI

Publicar schema interno; não expor admin endpoints.

## Ameaças

SEC-THR-006, 012, 028, 033.
