# AUTHZ-CMD-001

| Campo | Valor |
| --- | --- |
| Document ID | Matriz comando × autorização |
| CMDs | 22 |
| AUTHZ | 001..028 (funcional) + contextuais |
| Prompt | 08 |

| CMD | Nome | ROLE-CAND primário | Escopo | Alçada/condição | SEC-REQ | SOD | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CMD-001 | Registrar solicitação | 001 | OWN_RECORD | — | — | — | CANDIDATE |
| CMD-002 | Decidir solicitação | 002 | OPERATIONAL | DDP-002 | SEC-REQ-001 | SOD-001 | PENDING |
| CMD-003 | Converter em OS | 002, 003 | OPERATIONAL | Pós-decisão | SEC-REQ-002 | SOD-010 | CANDIDATE |
| CMD-004 | Preparar OS | 003 | OPERATIONAL | — | — | SOD-002 (com 005) | CANDIDATE |
| CMD-005 | Liberar OS | 002 | OPERATIONAL | DDP-003; PREPARADA | SEC-REQ-003 | SOD-002 | PENDING |
| CMD-006 | Atribuir responsável | 002, 003 | OPERATIONAL | OS liberada candidata | — | — | CANDIDATE |
| CMD-007 | Confirmar recebimento | 005 | ASSIGNED | DDP-032 | — | — | PENDING |
| CMD-008 | Iniciar execução | 004 | ASSIGNED | LIBERADA | — | — | CANDIDATE |
| CMD-009 | Registrar progresso | 004 | ASSIGNED | EM_EXECUCAO; adicional→SEC-008 | SEC-REQ-008 | — | CANDIDATE |
| CMD-010 | Concluir OS | 004 | ASSIGNED | SOD-003? | — | SOD-003 | CANDIDATE |
| CMD-011 | Cancelar OS | 002 | OPERATIONAL | DDP-004 | SEC-REQ-004 | SOD-011 | PENDING |
| CMD-012 | Reabrir OS | 002 | OPERATIONAL | DDP-005 | SEC-REQ-004 | — | PENDING |
| CMD-013 | Alterar OS | 003, 002 | OPERATIONAL | Estado editável | — | — | CANDIDATE |
| CMD-014 | Planejar recursos | 006 | OPERATIONAL | — | — | — | CANDIDATE |
| CMD-015 | Alocar recurso | 006 | OPERATIONAL | — | — | — | CANDIDATE |
| CMD-016 | Anexar evidência | 004, 014 | DOCUMENT | — | — | — | CANDIDATE |
| CMD-017 | Submeter medição | 007 | OPERATIONAL | Pós-conclusão | — | SOD-004 | CANDIDATE |
| CMD-018 | Decidir medição | 008 | OPERATIONAL | ≠ submissor | SEC-REQ-005 | SOD-004 | PENDING |
| CMD-019 | Preparar faturamento | 009 | FINANCIAL | Medição aprovada | — | SOD-005 | CANDIDATE |
| CMD-020 | Registrar nota | 010 | FINANCIAL | Faturamento liberado | SEC-REQ-006 | SOD-009 | PENDING |
| CMD-021 | Registrar pagamento | 011 | FINANCIAL | DDP-012 | — | SOD-005, SOD-009 | PENDING |
| CMD-022 | Substituir documento | 014 | DOCUMENT | PRED-009 | SEC-REQ-010 | SOD-008 | CANDIDATE |

## Detalhe AUTHZ-005 — CMD-005 Liberar OS

| Campo | Valor |
| --- | --- |
| Ator | ACT-002 |
| Papel | ROLE-CAND-002 |
| Ação | Liberar |
| Recurso | OS (TERM-002) |
| Contexto | STATE-CAND-007; INV-002 |
| Dados acessíveis | Conteúdo OS, referências comerciais candidatas |
| Dados ocultos | Custo/margem se ator não tem AUTHZ-015/016 |
| Efeito financeiro | Habilita cadeia futura |
| Criticidade | CRITICAL |
| Auditabilidade | AUDIT_TRAIL + DOMAIN_HISTORY + SECURITY_AUDIT |
| Status | PENDING_BUSINESS_DECISION |

## Comandos sem autorização confirmada

CMD-021 (pagamento), CMD-002 (decisão), CMD-012 (reabertura) — bloqueados por DDP até decisão empresarial.
