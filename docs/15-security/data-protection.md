# SEC-DATA-001

| Campo | Valor |
| --- | --- |
| Document ID | Proteção de dados |
| Prompt | 14 |

## Classificação (herda Prompt 12 column-semantics)

| Nível | Exemplos | Controles |
| --- | --- | --- |
| PUBLIC | status_code público? | Mínimo |
| INTERNAL | qty planejada | AuthN + escopo OS |
| RESTRICTED | PII, intake | Minimização ADP-005 |
| FINANCIAL | custo, margem, NF | AuthZ campo + audit |
| DOCUMENT | evidência binária | Signed URL + AuthZ |
| SECRET | credenciais | Secret manager |
| AUDIT | SECURITY_AUDIT | Append-only |

## Proteção em repouso

| Ativo | Mecanismo candidato | SEC-REQ |
| --- | --- | --- |
| PostgreSQL | TDE/cloud encryption | SEC-REQ-022 |
| Object storage | SSE-S3/KMS | SEC-REQ-022 |
| Backups | Encrypted | SEC-AST-018 |
| Logs | Redaction | logging-and-redaction.md |

## Proteção em trânsito

TLS 1.2+ everywhere TB-01/03/04/05.

## Minimização

| Prática | Aplicação |
| --- | --- |
| Field projection | API DTOs sem custo default |
| Retention | data-retention-pending.md |
| Pseudonymization | TBD — não afirmar LGPD |

## Custo e margem (INV-006)

| Camada | Proteção |
| --- | --- |
| DB | Sem RLS ainda — app layer |
| API | Omitir campos |
| Export | AUTHZ-026 |
| Logs | Redact |

## Documentos restritos

classification_code guia bucket policy e AuthZ CMD-022.

## Multi-tenant

SEC-REQ-019 — `tenant_id` em toda query write/read quando ADP-014 fechar.

## Privacy

ADP-005 OPEN — não inventar base legal. Operacional mínimo candidato.

## Ameaças

SEC-THR-015..017, 022, 027, 029, 036.
