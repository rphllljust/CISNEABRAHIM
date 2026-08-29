# SEC-LOG-001

| Campo | Valor |
| --- | --- |
| Document ID | Logging e redaction |
| SEC-REQ | SEC-REQ-013 |
| Prompt | 14 |

## Três canais (não misturar)

| Canal | Conteúdo | Sensível |
| --- | --- | --- |
| TECHNICAL_LOG | Request id, latência, errors | Redacted |
| DOMAIN_HISTORY | Eventos negócio DE-* | Resumo sem PII excesso |
| SECURITY_AUDIT | AuthZ deny, export, admin | Imutável candidato |

## Redaction obrigatória

| Dado | Ação |
| --- | --- |
| Authorization header | `[REDACTED]` |
| Cookie | `[REDACTED]` |
| Password / secret | Nunca logar |
| CPF/tax_id | Mascarar `***.***.***-**` |
| Custo/margem | Não logar valores |
| Card/bank | Não aplicável — sem PCI scope afirmado |
| Full intake PII | Truncar/hash |
| JWT payload | sub only |

## Níveis log

| Level | Uso prod |
| --- | --- |
| error | Sim |
| warn | Sim |
| info | Sim — sem PII |
| debug | Dev only |

## Structured logging

JSON fields: `trace_id`, `actor_id`, `cmd`, `resource_id` — não body.

## Acesso logs

| Quem | TECHNICAL_LOG | SECURITY_AUDIT |
| --- | --- | --- |
| Devops | Sim | Não default |
| Security officer | Sim | Sim |
| Usuário negócio | Não | Não |

## Ameaça

SEC-THR-027.

## Ferramenta

Pino (NestJS) candidato — child logger redactors.
