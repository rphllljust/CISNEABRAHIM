# DBND-REL-001

| Campo | Valor |
| --- | --- |
| Document ID | Relações entre bounded contexts |
| Prompt | 05 |

| Upstream | Downstream | Relação candidata | Justificativa | Risco |
| --- | --- | --- | --- | --- |
| BC-CAND-018 Integration | BC-CAND-003 Commercial | **ANTI_CORRUPTION_LAYER** | ERP/protocolo externo não deve contaminar linguagem OS | RISK-010 |
| BC-CAND-018 | BC-CAND-004 PO | **ANTI_CORRUPTION_LAYER** | PO pode vir de sistema cliente | DDP-009 |
| BC-CAND-005 Service Request | BC-CAND-006 Service Order | **CUSTOMER_SUPPLIER** | Solicitação fornece origem; OS consome | RISK-004 |
| BC-CAND-006 Service Order | BC-CAND-008 Execution | **CUSTOMER_SUPPLIER** | OS liberada habilita execução | RISK-003 |
| BC-CAND-008 Execution | BC-CAND-010 Measurement | **CUSTOMER_SUPPLIER** | Quantidades realizadas alimentam medição | DDP-010 |
| BC-CAND-010 Measurement | BC-CAND-011 Billing | **CUSTOMER_SUPPLIER** | Medição aprovada candidata a faturar | RISK-005 |
| BC-CAND-011 Billing | BC-CAND-012 Invoice | **CUSTOMER_SUPPLIER** | Preparação → registro nota | DDP-023 |
| BC-CAND-012 Invoice | BC-CAND-013 Payment | **UPSTREAM_DOWNSTREAM** | Pagamento referencia nota — SoT pendente | DDP-012 |
| BC-CAND-003 Commercial | BC-CAND-006 Service Order | **CONFORMIST** (candidato) | OS pode precisar conformar-se a referência ERP | RISK-009 |
| BC-CAND-007 Resource | BC-CAND-006 Service Order | **PARTNERSHIP** (candidato) | Planejamento/alocação coevoluem com itens OS | DBND-002 |
| BC-CAND-009 Evidence | BC-CAND-014 Document | **CUSTOMER_SUPPLIER** | Evidência usa armazenamento documental | RISK-008 |
| BC-CAND-017 Audit | Todos operacionais | **CONFORMIST** downstream | BCs publicam fatos; auditoria consome | NFR-029 |
| BC-CAND-016 Reporting | Todos | **CONFORMIST** | Somente leitura; EVENTUAL_ACCEPTABLE | NFR-032 |
| BC-CAND-001 Identity | Todos | **OPEN_HOST_SERVICE** (candidato futuro) | Autenticação/autorização transversal | DDP-015 |
| BC-CAND-006 + BC-CAND-008 | — | **SHARED_KERNEL** | **REJEITADO** — alto risco; manter separados | DBND-003 |
| BC-CAND-013 Payment | ERP externo | **SEPARATE_WAYS** (candidato) | Se SoT for só ERP, BC-013 reduzido a réplica | DDP-012 |
| BC-CAND-002 Party | BC-CAND-005 | **UNKNOWN** | Cardinalidade cliente-solicitação TBD | DDP-002 |

Nenhuma relação `PUBLISHED_LANGUAGE` definida — contratos de integração ausentes (DDP-014).
