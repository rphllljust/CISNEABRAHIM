# AUTHZ-DELEG-001

| Campo | Valor |
| --- | --- |
| Document ID | Delegação e substituição |
| Prompt | 08 |
| Status | PENDING — sem fonte primária |

## Questões abertas (ADP-003)

| # | Pergunta |
| --- | --- |
| 1 | Substituto pode liberar OS em nome do autorizador? |
| 2 | Delegação é por período, por OS ou por cliente? |
| 3 | Quem registra a delegação — ROLE-016 ou gestão? |
| 4 | Evidência mínima da delegação? |

## Cenários candidatos

| Cenário | Comportamento esperado |
| --- | --- |
| Férias do autorizador | Substituto com mandato explícito |
| Substituto sem mandato | DENY-017 (delegação expirada) |
| Executor substituído em campo | Nova alocação SM-CAND-003 — não confundir com IAM |
| Acúmulo temporário de papéis | Exceção auditada — ADP-004 |

## Distinções

| Conceito | Domínio |
| --- | --- |
| Substituição de recurso operacional | Alocação (CMD-015) |
| Substituição de responsável OS | CMD-006 candidato |
| Delegação de alçada | IAM empresarial — **não modelado** |

## AUTHZ-042

Delegação expirada nega transições que exigem ROLE-CAND-002 até renovação.

## Auditoria

Toda delegação ativa: registrada em SECURITY_AUDIT candidato; não em TECHNICAL_LOG apenas.
