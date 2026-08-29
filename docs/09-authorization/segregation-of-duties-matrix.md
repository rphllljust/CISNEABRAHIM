# AUTHZ-SOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Matriz de segregação de funções |
| Total | 12 (SOD-001..012) |
| Prompt | 08 |

> Conflitos candidatos — **não** inventar aprovação de quatro olhos. Controle proporcional ao risco quando indicado.

| ID | Função A | Função B | Risco | Controle candidato | SEC-REQ | DDP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SOD-001 | Solicitar (CMD-001) | Aprovar solicitação (CMD-002) | Fraude de demanda | Atores distintos candidato | SEC-REQ-001 | DDP-002 | PENDING |
| SOD-002 | Preparar OS (CMD-004) | Liberar OS (CMD-005) | Bypass de controle | Maker-checker candidato | SEC-REQ-003 | DDP-022 | PENDING |
| SOD-003 | Executar (CMD-008/009) | Aprovar própria conclusão | Conflito interesse | Supervisor distinto? | SEC-REQ-014 | — | PENDING_SOURCE_VALIDATION |
| SOD-004 | Submeter medição (CMD-017) | Aprovar medição (CMD-018) | Inflar medição | Atores distintos | SEC-REQ-005 | DDP-010 | PENDING |
| SOD-005 | Preparar faturamento (CMD-019) | Registrar pagamento (CMD-021) | Desvio caixa | Atores distintos | SEC-REQ-006 | DDP-012 | PENDING |
| SOD-006 | Alterar preço | Aprovar alteração preço | Manipulação comercial | Alçada separada | SEC-REQ-007 | — | PENDING |
| SOD-007 | Administrar acesso (ROLE-016) | Qualquer ato financeiro | Privilege escalation | Proibição explícita | SEC-REQ-020 | DDP-015 | CANDIDATE |
| SOD-008 | Substituir documento (CMD-022) | Aprovar própria substituição | Ocultar evidência | Aprovador distinto | SEC-REQ-010 | DDP-013 | PENDING |
| SOD-009 | Registrar nota (CMD-020) | Registrar pagamento (CMD-021) | Fraude fiscal | Distinção candidata | SEC-REQ-006 | — | PENDING |
| SOD-010 | Converter solicitação (CMD-003) | Decidir solicitação (CMD-002) | Auto-aprovação | Distinção candidata | SEC-REQ-002 | DDP-002 | PENDING |
| SOD-011 | Cancelar OS (CMD-011) | Executar mesma OS | Sabotagem/oportunismo | Janela temporal? | SEC-REQ-004 | DDP-004 | PENDING |
| SOD-012 | Admin técnico (ROLE-015) | Autorizador empresarial (ROLE-002) | Poder total indevido | **Proibido acumular** sem decisão | SEC-REQ-014 | DDP-015 | CANDIDATE |

## Controles candidatos (não confirmados)

| Controle | Descrição | Quando proporcional |
| --- | --- | --- |
| Separação de atores | A ≠ B fisicamente | SOD-001, 002, 004, 005 |
| Alçada elevada | Gestão aprova exceção | SOD-006, 011 |
| Auditoria reforçada | Sem bloqueio, com registro | Quando separação inviável operacionalmente — ADP-004 |
| Quatro olhos | Dois aprovadores | **Não adotado** sem fonte — apenas candidato de risco extremo |

## Matriz de compatibilidade ROLE (candidata)

|  | 002 Auth | 003 Prep | 004 Exec | 007 Med-prep | 008 Med-apr | 011 Pag | 015 TI |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 002 | — | SOD-002 | — | — | — | — | SOD-012 |
| 003 | — | — | SOD-003? | — | — | — | — |
| 007 | — | — | — | — | SOD-004 | — | — |
| 009 | — | — | — | — | — | SOD-005 | SOD-007 |
| 016 | — | — | — | — | — | SOD-007 | SOD-007 |

`?` = PENDING_SOURCE_VALIDATION
