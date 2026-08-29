# DBEH-AUDIT-POL-001

| Campo | Valor |
| --- | --- |
| Document ID | Política de separação de auditoria |
| Prompt | 06 |

## Classificação proporcional (NFR-029)

| Nível | O que registrar | Exemplos |
| --- | --- | --- |
| NONE | Leitura rotineira não sensível | Lista OS pública interna TBD |
| STANDARD | CRUD operacional não financeiro | Alteração descrição OS |
| SENSITIVE | Liberação, conversão, alocação | CMD-003, CMD-005, CMD-015 |
| FINANCIAL | Medição, faturamento, pagamento | CMD-017..021 |
| SECURITY_CRITICAL | Custo/margem, exportação, acesso negado | INV-006; SEC-REQ-024 |

## Separação obrigatória

| Tipo | Conteúdo | Não confundir com |
| --- | --- | --- |
| AUDIT_TRAIL | Ação empresarial, ator, timestamp | DE de domínio |
| SECURITY_AUDIT | Login falho, exportação sensível | TECHNICAL_LOG |
| TECHNICAL_LOG | Stack, request id | AUDIT_TRAIL |
| DOMAIN_HISTORY | Estado negócio | Log debug |

## Comandos rejeitados

REJ-* devem gerar registro **AUDIT_TRAIL** ou **SECURITY_AUDIT** quando tentativa sensível — não DE de sucesso.

## BC owner

BC-CAND-017 centraliza consumo; BCs operacionais **publicam** fatos.

Não auditar toda leitura comum (NFR proporcional).
