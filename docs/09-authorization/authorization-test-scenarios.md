# AUTHZ-TEST-001

| Campo | Valor |
| --- | --- |
| Document ID | Cenários de teste conceituais (futuros) |
| Prompt | 08 |
| Implementação | **Nenhuma** |

## Cenários negativos obrigatórios

| ID | Cenário | Resultado esperado | DENY/REJ |
| --- | --- | --- | --- |
| TSC-AUTH-001 | Ator sem permissão tenta CMD-005 | Negação + SECURITY_AUDIT | DENY-003 |
| TSC-AUTH-002 | Permissão válida, OS fora de escopo (outro cliente) | Negação contextual | DENY-010 / AUTHZ-040 |
| TSC-AUTH-003 | Acesso documento por URL direta sem auth | Negação | DENY-018 |
| TSC-AUTH-004 | Executor tenta alterar preço em OS liberada | Negação | DENY-008 / AUTHZ-032 |
| TSC-AUTH-005 | Preparador tenta liberar própria OS | SoD | DENY-003, SOD-002 |
| TSC-AUTH-006 | Conta desativada executa qualquer CMD | Negação total | AUTHZ-041 |
| TSC-AUTH-007 | Delegação expirada libera OS | Negação | DENY-017 |
| TSC-AUTH-008 | Mesmo ator submete e aprova medição | SoD | DENY-011 |
| TSC-AUTH-009 | Admin técnico registra pagamento | SoD | DENY-015, SOD-012 |
| TSC-AUTH-010 | Gestor acesso provisiona si e paga fatura | SoD | DENY-015, SOD-007 |

## Cenários positivos candidatos

| ID | Cenário | Verificação |
| --- | --- | --- |
| TSC-AUTH-011 | Autorizador libera OS preparada | DE-004 + audit |
| TSC-AUTH-012 | Financeiro autorizado vê margem | AUTHZ-016 satisfeito |
| TSC-AUTH-013 | Executor vê OS sem custo | Campos omitidos |
| TSC-AUTH-014 | Aprovador medição distinto de submissor | SOD-004 ok |

## Cenários de conflito de funções

| ID | Cenário |
| --- | --- |
| TSC-AUTH-015 | Acúmulo ROLE-003 + ROLE-002 — política ADP-001 |
| TSC-AUTH-016 | Preparador faturamento registra pagamento — SOD-005 |

## Cenários de auditoria

| ID | Cenário |
| --- | --- |
| TSC-AUTH-017 | DENY-003 gera SECURITY_AUDIT sem vazar existência OS (SEC-REQ-015) |
| TSC-AUTH-018 | Exportação custo gera AUTHZ-026 + SEC-REQ-016 |

## Cenários administrativos indevidos

| ID | Cenário |
| --- | --- |
| TSC-AUTH-019 | Admin TI altera alçada empresarial via painel técnico — proibido ADP-010 |
| TSC-AUTH-020 | Break-glass sem registro — falha ADP-009 |
