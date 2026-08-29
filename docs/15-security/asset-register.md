# SEC-AST-REG-001

| Campo | Valor |
| --- | --- |
| Document ID | Registro de ativos |
| Total | 18 (SEC-AST-001..018) |
| Prompt | 14 |

| ID | Ativo | Classificação | Owner BC | Criticidade |
| --- | --- | --- | --- | --- |
| SEC-AST-001 | Credenciais usuário / tokens | SECRET | BC-001 | CRITICAL |
| SEC-AST-002 | Segredos aplicação (DB, API keys) | SECRET | Infra | CRITICAL |
| SEC-AST-003 | Dados OS operacionais | INTERNAL | BC-006 | HIGH |
| SEC-AST-004 | Custo interno / margem | RESTRICTED FINANCIAL | BC-003 | CRITICAL |
| SEC-AST-005 | Preço comercial | RESTRICTED FINANCIAL | BC-003 | HIGH |
| SEC-AST-006 | Medição e faturamento | FINANCIAL | BC-010/011 | CRITICAL |
| SEC-AST-007 | Nota fiscal informada | FINANCIAL | BC-012 | CRITICAL |
| SEC-AST-008 | Registro pagamento | FINANCIAL | BC-013 | CRITICAL |
| SEC-AST-009 | Documentos evidência (binário) | RESTRICTED DOCUMENT | BC-014 | HIGH |
| SEC-AST-010 | Dados pessoais party/intake | RESTRICTED PII | BC-002/005 | HIGH |
| SEC-AST-011 | Chaves idempotência / sessão | INTERNAL | App | MEDIUM |
| SEC-AST-012 | DOMAIN_HISTORY (audit empresarial) | AUDIT | BC-017 | HIGH |
| SEC-AST-013 | SECURITY_AUDIT | AUDIT IMMUTABLE | BC-017/Sec | CRITICAL |
| SEC-AST-014 | Integração staging/inbox | INTERNAL | BC-018 | HIGH |
| SEC-AST-015 | Mapeamento IDs externos | INTERNAL | BC-018 | MEDIUM |
| SEC-AST-016 | Saldo PO | FINANCIAL | BC-004 | HIGH |
| SEC-AST-017 | Logs técnicos | INTERNAL | Infra | MEDIUM |
| SEC-AST-018 | Backups DB / object storage | RESTRICTED | Infra | CRITICAL |

## Valor para o negócio

| Ativo | Impacto se comprometido |
| --- | --- |
| SEC-AST-004..008 | Fraude financeira, perda confiança |
| SEC-AST-009 | Vazamento evidência campo / contrato |
| SEC-AST-010 | Exposição pessoal — decisão ADP-005 pendente |
| SEC-AST-012/013 | Repúdio, falha investigação |
| SEC-AST-001/002 | Takeover completo |

## Não é ativo separado

Dados agregados em relatório BC-016 — derivado com mesmas classificações da fonte.
