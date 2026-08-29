# SEC-AUDIT-001

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | Segurança do audit trail |
| SEC-REQ     | SEC-REQ-020, SEC-REQ-024 |
| Prompt      | 14                       |

## Separação (Prompt 06 + 13)

| Store                    | Mutabilidade             | Quem escreve    |
| ------------------------ | ------------------------ | --------------- |
| aud.domain_history_entry | Append-only empresarial  | Domain TX       |
| SECURITY_AUDIT           | Append-only **imutável** | Security module |
| TECHNICAL_LOG            | Rotativo                 | Infra           |

## Eventos SECURITY_AUDIT candidatos

| Categoria  | Exemplos                        |
| ---------- | ------------------------------- |
| AuthN      | Login fail/success, logout, MFA |
| AuthZ deny | DENY-* sensíveis                |
| Admin      | Role change, break-glass        |
| Export     | AUTHZ-026 financial export      |
| Integração | Webhook reject HMAC             |
| Dados      | Download doc RESTRICTED         |

## Campos mínimos

`occurred_at`, `actor_id`, `action`, `resource_type`, `resource_id`, `outcome`, `ip`, `correlation_id`, `metadata_sanitized`

## Imutabilidade

| Opção               | Status       |
| ------------------- | ------------ |
| DB append-only role | CANDIDATE    |
| WORM storage        | ADP-011 OPEN |
| Hash chain          | FUTURE       |

## Acesso leitura

ROLE auditoria futura — AUTHZ-026. Admin técnico **não** altera SECURITY_AUDIT.

## Repúdio

SEC-THR-004, SEC-THR-032 — controles SEC-CTL-004, SEC-CTL-029.

## Retenção

Longa — alinhada domain history; período TBD jurídico **não inventado**.

## Diferença DOMAIN_HISTORY

DE-* = transição negócio. SECURITY_AUDIT = segurança e acesso.
