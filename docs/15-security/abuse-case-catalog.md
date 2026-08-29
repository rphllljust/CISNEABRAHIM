# SEC-ABU-001

| Campo | Valor |
| --- | --- |
| Document ID | Catálogo de casos de abuso empresarial |
| Total | 16 (SEC-ABU-001..016) |
| Prompt | 14 |

> Abuso = uso legítimo da interface para fim não autorizado ou fraude por insider.

| ID | Nome | Ator | Cenário | Ativo | Controle | SEC-THR |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-ABU-001 | Auto-aprovação solicitação | Solicitante | CMD-001 + CMD-002 mesmo ator | OS pipeline | SOD-001 | — |
| SEC-ABU-002 | Maker-checker bypass OS | Preparador | CMD-004 + CMD-005 | SEC-AST-003 | SOD-002, SEC-REQ-003 | SEC-THR-010 |
| SEC-ABU-003 | Liberação sem PO saldo | Coordenador | CMD-005 com PO esgotado | SEC-AST-016 | INV-012, AuthZ | SEC-THR-011 |
| SEC-ABU-004 | Ver custo via devtools | Executor | Chama API omitindo UI filter | SEC-AST-004 | SEC-CTL-013 projeção | SEC-THR-015 |
| SEC-ABU-005 | Exportar margem para planilha | Analista | Endpoint export sem papel | SEC-AST-004 | AUTHZ-026 | SEC-THR-016 |
| SEC-ABU-006 | Adicional não autorizado | Executor | CMD-009 qty extra | SEC-AST-003 | SEC-REQ-008 | — |
| SEC-ABU-007 | Auto-aprovar medição | Medidor | CMD-017 + CMD-018 | SEC-AST-006 | SOD-004 | SEC-THR-018 |
| SEC-ABU-008 | Medição sem execução real | Executor+cumplice | CMD-017 sem campo | SEC-AST-006 | INV-008 + evidência | SEC-THR-034 |
| SEC-ABU-009 | Nota duplicada integração | Financeiro | Reenviar CMD-020 | SEC-AST-007 | Idempotency | SEC-THR-020 |
| SEC-ABU-010 | Pagamento fantasma webhook | Atacante | POST falso | SEC-AST-008 | HMAC inbox | SEC-THR-019 |
| SEC-ABU-011 | Substituir evidência pós-auditoria | Gestor | CMD-022 | SEC-AST-009 | AuthZ + versão | SEC-THR-024 |
| SEC-ABU-012 | Cancelamento massivo | Supervisor | CMD-011 em lote | SEC-AST-003 | Alçada SEC-REQ-004 | SEC-THR-035 |
| SEC-ABU-013 | Reabrir OS concluída | Operador | CMD-012 | SEC-AST-003 | PENDING DDP-005 | — |
| SEC-ABU-014 | Alterar preço após faturamento | Comercial | CMD-013 | SEC-AST-005 | SEC-REQ-007 | SEC-THR-017 |
| SEC-ABU-015 | Acesso emergência sem trilha | Admin | Break-glass | SEC-AST-013 | Emergency access audit | SEC-THR-004 |
| SEC-ABU-016 | Enumerar OS concorrente | Externo | Scan IDs | SEC-AST-003 | Rate limit + deny | SEC-THR-012 |

## Detecção candidata

| Sinal | Ação |
| --- | --- |
| Muitos DENY-006 em curto período | Alerta segurança |
| Export FINANCIAL fora horário | SECURITY_AUDIT review |
| SoD violation attempt | DENY + audit |

## Não é abuso técnico

Erro operacional honesto — tratado por SM/REJ, não threat externo.
