# SEC-SES-001

| Campo | Valor |
| --- | --- |
| Document ID | Segurança de sessão |
| SEC-REQ | SEC-REQ-011 |
| Prompt | 14 |

## Modelo candidato

| Aspecto | Decisão candidata |
| --- | --- |
| Tipo | Stateless JWT access + refresh rotativo **ou** server session — SEC-DEC-002 |
| Access TTL | 15–60 min candidato |
| Refresh TTL | 8–24h com rotação |
| Idle timeout | 30–120 min candidato |
| Absolute timeout | 12–24h |

## Controles

| ID | Controle |
| --- | --- |
| SEC-CTL-003 | Regenerar session ID / invalidate refresh on login |
| SEC-CTL-034 | Logout invalida refresh server-side (allowlist/blocklist) |
| SEC-CTL-035 | Binding opcional IP/UA — **PENDING** (frágil mobile) |
| SEC-CTL-036 | Concurrent session limit — candidato admin=1 |

## Cookies (se session cookie)

| Flag | Valor |
| --- | --- |
| HttpOnly | true |
| Secure | true (prod) |
| SameSite | Lax ou Strict |
| Path | restrito |

## JWT (se bearer)

| Claim | Uso |
| --- | --- |
| sub | IdP user |
| exp, iat | Expiração |
| aud, iss | Validação |
| **Não** colocar custo/margem/roles extensos | Menor payload |

## Encerramento

| Evento | Ação |
| --- | --- |
| Logout explícito | Revogar refresh |
| Mudança senha | Revogar todas sessões |
| Desligamento funcionário | IdP disable + revoke |

## Ameaças

SEC-THR-001, 003, 006 — threat-model-stride.md.

## Mobile campo

Refresh seguro em keychain; sem token em logs — SEC-REQ-013.
