# SEC-SECRET-001

| Campo | Valor |
| --- | --- |
| Document ID | Política de credenciais e segredos |
| SEC-REQ | SEC-REQ-013 |
| Prompt | 14 |

## Classificação

| Tipo | Exemplos | Armazenamento candidato |
| --- | --- | --- |
| User password | — | IdP only — não PG app |
| JWT signing key | RSA/EC key | Secret manager / KMS |
| DB password | drizzle connection | Env + secret manager |
| Webhook HMAC secret | BC-018 | Secret manager per integração |
| Object storage keys | S3 | IAM role preferido vs static key |
| API keys M2M | ERP | Rotacionável 90d candidato |

## Regras

| # | Regra |
| --- | --- |
| 1 | Nunca commitar `.env`, keys, tokens no git |
| 2 | Pre-commit secret scan candidato (gitleaks/trufflehog) |
| 3 | Logs: redact `Authorization`, `Cookie`, connection strings |
| 4 | UI: nunca exibir segredo após criação (show once) |
| 5 | Rotação sem downtime — dual key JWT candidato |
| 6 | Dev secrets ≠ prod — SEC-CTL-026 |

## Geração

| Segredo | Entropia |
| --- | --- |
| HMAC webhook | ≥ 256 bits random |
| Session secret | ≥ 256 bits |
| Idempotency | UUID v4 |

## Acesso

| Quem | Pode |
| --- | --- |
| App runtime | Read via env/secret manager |
| Desenvolvedor | Dev vault only |
| CI | OIDC to cloud secrets — não long-lived |

## Incidente vazamento

Ver incident-response-baseline.md — revoke + rotate imediato.

## Ameaça

SEC-THR-026.
