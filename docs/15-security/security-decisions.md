# SEC-DEC-REG-001

| Campo | Valor |
| --- | --- |
| Document ID | Decisões de segurança |
| Total | 16 (SEC-DEC-001..016) |
| Prompt | 14 |

| ID | Decisão | Escolha candidata | Status |
| --- | --- | --- | --- |
| SEC-DEC-001 | AuthN protocol | OIDC Authorization Code + PKCE | PROPOSED |
| SEC-DEC-002 | Session model | JWT access + refresh rotativo | PROPOSED |
| SEC-DEC-003 | MFA | Obrigatório financeiro + admin | PROPOSED |
| SEC-DEC-004 | CSRF | Mitigado via bearer; CSRF se cookie session | PROPOSED |
| SEC-DEC-005 | AuthZ enforcement | Backend obrigatório — zero trust UI | **ACCEPTED** doc |
| SEC-DEC-006 | Field-level financial | Omitir custo/margem em DTO default | PROPOSED |
| SEC-DEC-007 | IDOR response | 403 genérico mesmo shape | PROPOSED |
| SEC-DEC-008 | Rate limiting | Habilitar login + API + export | PROPOSED |
| SEC-DEC-009 | Webhook auth | HMAC-SHA256 header | PROPOSED |
| SEC-DEC-010 | Upload scan | Async AV antes promote | PROPOSED |
| SEC-DEC-011 | Secrets | Secret manager prod — não .env file | PROPOSED |
| SEC-DEC-012 | SECURITY_AUDIT store | Tabela append-only separada | PROPOSED |
| SEC-DEC-013 | Tenant isolation | Mandatory filter quando ADP-014 fechar | PENDING |
| SEC-DEC-014 | Encryption at rest | Cloud provider default + KMS | PROPOSED |
| SEC-DEC-015 | Pen test | Anual staging pré-major release | PROPOSED |
| SEC-DEC-016 | Privacy legal basis | Não definir — ADP-005 | PENDING |

## Controles mapeados (SEC-CTL sample)

| CTL | Descrição |
| --- | --- |
| SEC-CTL-001 | MFA policy |
| SEC-CTL-002 | JWT validation |
| SEC-CTL-007 | Command AuthZ gate |
| SEC-CTL-013 | Financial field projection |
| SEC-CTL-017 | Webhook HMAC |
| SEC-CTL-033 | Tenant query filter |

Lista completa implícita em threat-model-stride.md (36 ameaças).

## Relação ADR

| ADR | SEC-DEC |
| --- | --- |
| ADR-005 integração | SEC-DEC-009 |
| ADR-004 consistência | AuthZ local |

## Revisão

Pós Prompt 20 (auth) e Prompt 21 (authz técnica).
