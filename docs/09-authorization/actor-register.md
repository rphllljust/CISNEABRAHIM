# AUTHZ-ACT-001

| Campo | Valor |
| --- | --- |
| Document ID | Registro de atores empresariais |
| Total | 12 (ACT-001..012) |
| Prompt | 08 |

> Ator = entidade que **pode** iniciar ação empresarial. Distinto de conta técnica ou login.

## ACT-001 — Solicitante

| Campo | Valor |
| --- | --- |
| TERM | TERM-005 |
| STK | STK-003 (parcial) |
| Papel candidato | ROLE-CAND-001 |
| Ações típicas | Registrar solicitação (CMD-001) |
| Escopo candidato | OWN_RECORD, CLIENT_SCOPE |
| Fonte | EV-027 |
| Status | CANDIDATE |

## ACT-002 — Autorizador empresarial

| Campo | Valor |
| --- | --- |
| TERM | TERM-007 |
| Papel candidato | ROLE-CAND-002 |
| Ações típicas | Decidir solicitação, liberar OS, cancelar/reabrir (DDP) |
| Escopo | OPERATIONAL_SCOPE, UNIT_SCOPE |
| Fonte | EV-039, EV-080 |
| Status | AMBIGUOUS — alçada DDP-003 |
| Nota | **≠ administrador técnico** |

## ACT-003 — Executor de serviço

| Campo | Valor |
| --- | --- |
| TERM | TERM-006 |
| Papel candidato | ROLE-CAND-004 |
| Ações | Iniciar execução, progresso, evidência |
| Escopo | ASSIGNED_RECORD, OPERATIONAL_SCOPE |
| Fonte | EV-037, EV-044 |
| Status | CANDIDATE |

## ACT-004 — Responsável pela OS

| Campo | Valor |
| --- | --- |
| TERM | TERM-008 |
| Papel candidato | ROLE-CAND-005 |
| Ações | Visualizar, confirmar recebimento (CMD-007 candidato) |
| Escopo | ASSIGNED_RECORD |
| Fonte | EV-084 |
| Status | AMBIGUOUS — DDP-032 |

## ACT-005 — Preparador operacional

| Campo | Valor |
| --- | --- |
| Descrição | Prepara conteúdo OS, planeja recursos |
| Papel candidato | ROLE-CAND-003, ROLE-CAND-006 |
| Ações | CMD-004, CMD-014 |
| Escopo | OPERATIONAL_SCOPE |
| Status | CANDIDATE |

## ACT-006 — Analista de medição

| Campo | Valor |
| --- | --- |
| TERM | TERM-016 (parcial) |
| Papel candidato | ROLE-CAND-007, ROLE-CAND-008 |
| Ações | Submeter (CMD-017), decidir (CMD-018) |
| Status | PENDING_BUSINESS_DECISION — SoD |

## ACT-007 — Ator financeiro candidato

| Campo | Valor |
| --- | --- |
| STK | STK-004 |
| Papel candidato | ROLE-CAND-009..011 |
| Ações | Faturamento, nota, pagamento |
| Escopo | FINANCIAL_SCOPE |
| Status | UNCONFIRMED |

## ACT-008 — Ator comercial candidato

| Campo | Valor |
| --- | --- |
| TERM | TERM-011, TERM-015 |
| Papel candidato | ROLE-CAND-012 |
| Ações | Referência comercial, preço candidato |
| Status | PENDING_SOURCE_VALIDATION |

## ACT-009 — Gestão / direção candidata

| Campo | Valor |
| --- | --- |
| STK | STK-001 |
| Papel candidato | ROLE-CAND-002 (superconjunto?) |
| Ações | Alçadas elevadas candidatas |
| Status | UNCONFIRMED — sem nomes |

## ACT-010 — Administrador técnico

| Campo | Valor |
| --- | --- |
| STK | STK-005 |
| Papel candidato | ROLE-CAND-015 |
| Ações | Infraestrutura, contas, logs técnicos |
| **Proibido assumir** | Liberar OS, alterar preço, registrar pagamento |
| Status | CANDIDATE — segregação explícita SOD-007 |

## ACT-011 — Integração / sistema externo

| Campo | Valor |
| --- | --- |
| Descrição | Ator não-humano para sincronização |
| Papel candidato | — |
| Ações | DE-020 candidato |
| Escopo | CONTRACT_SCOPE |
| Status | PENDING — SEC-REQ-021 |

## ACT-012 — Agente de engenharia

| Campo | Valor |
| --- | --- |
| STK | STK-006 |
| Autoridade | Governança repositório apenas |
| Ações empresariais | **Nenhuma** |
| Status | Definido (SRC-000) |

## Matriz ator × stakeholder

| ACT | STK | Confirmado |
| --- | --- | --- |
| ACT-001..003 | STK-003 | Não |
| ACT-007 | STK-004 | Não |
| ACT-010 | STK-005 | Não |
| ACT-009 | STK-001 | Não |
