# DBND-RISK-001

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Document ID | Riscos de fronteira de domínio |
| Prompt      | 05                             |

| ID         | Risco                                        | Contextos              | Probabilidade         | Impacto  | Mitigação candidata            | RISK existente |
| ---------- | -------------------------------------------- | ---------------------- | --------------------- | -------- | ------------------------------ | -------------- |
| DBND-R-001 | Big ball of mud — sem fronteiras no monólito | Todos                  | HIGH se mal governado | HIGH     | Módulos por BC; ownership docs | RISK-014       |
| DBND-R-002 | Distribuição prematura                       | Núcleo 005–012         | MEDIUM                | HIGH     | Modular monolith primeiro      | RISK-011       |
| DBND-R-003 | Duplicidade solicitação/OS                   | BC-005, BC-006         | MEDIUM                | HIGH     | NFR-002, NFR-003               | RISK-004       |
| DBND-R-004 | SoT externo ignorado                         | BC-018, BC-003/004/013 | HIGH                  | HIGH     | ACL; DDP-020                   | RISK-010       |
| DBND-R-005 | SHARED_KERNEL indevido                       | BC-006, BC-008         | MEDIUM                | MEDIUM   | DBND-003; eventos              | —              |
| DBND-R-006 | Auditoria fragmentada                        | BC-017 vs outros       | MEDIUM                | MEDIUM   | BC-017 central                 | RISK-024       |
| DBND-R-007 | Fronteira financeira fraca                   | BC-010..013            | MEDIUM                | CRITICAL | Invariantes NFR-011            | RISK-005       |
| DBND-R-008 | PO saldo duplo write                         | BC-003, BC-004         | MEDIUM                | HIGH     | DDP-009                        | RISK-009       |
| DBND-R-009 | Integração WhatsApp como core                | BC-005, BC-018         | LOW                   | MEDIUM   | CAPABILITY_ONLY                | DDP-021        |
| DBND-R-010 | Reporting com write acidental                | BC-016                 | LOW                   | MEDIUM   | Read-only policy               | —              |

**Total riscos registrados:** 10

Vincular novos riscos ao risk-register em revisão futura se promovidos — não alterar RISK-* neste prompt sem gate.
