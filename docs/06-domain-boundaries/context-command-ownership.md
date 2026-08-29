# DBND-CMD-OWN-001

| Campo | Valor |
| --- | --- |
| Document ID | Ownership de comandos por contexto |
| Prompt | 05 |

> Comandos = intenções de mudança empresarial (verbos). Nomes técnicos em command-candidates.md — não congelados.

| Comando candidato (PT) | BC owner | FR | Idempotência (NFR) |
| --- | --- | --- | --- |
| Registrar solicitação | BC-CAND-005 | FR-001 | NFR-002 |
| Decidir solicitação | BC-CAND-005 | FR-006 | UNKNOWN |
| Converter em OS | BC-CAND-006 | FR-009 | NFR-003 |
| Preparar conteúdo OS | BC-CAND-006 | FR-011 | SAFE_REPEAT |
| Liberar OS | BC-CAND-006 | FR-014 | NFR-004 |
| Atribuir responsável | BC-CAND-006 | FR-015 | AMBIGUOUS |
| Confirmar visualização | BC-CAND-006 | FR-016 | AMBIGUOUS |
| Iniciar execução | BC-CAND-008 | FR-017 | UNIQUE |
| Registrar progresso / adicional | BC-CAND-008 | FR-018 | NFR-015 |
| Concluir OS | BC-CAND-008 / BC-006 | FR-019 | UNIQUE |
| Cancelar OS | BC-CAND-006 | FR-020 | UNIQUE |
| Reabrir OS | BC-CAND-006 | FR-021 | BLOCKED DDP-005 |
| Alterar OS (histórico) | BC-CAND-006 | FR-022 | NFR-001 |
| Planejar recursos | BC-CAND-007 | FR-013 | SAFE_REPEAT |
| Alocar recurso | BC-CAND-007 | FR-025 | NFR-005 |
| Vincular referência comercial | BC-CAND-003 | FR-029, FR-030 | NFR-012 |
| Consumir / controlar PO | BC-CAND-004 | FR-033 | FINANCIAL_RACE |
| Anexar evidência | BC-CAND-009 | FR-040 | IDEM-REQ-005 |
| Submeter medição | BC-CAND-010 | FR-036 | NFR-013 |
| Decidir medição | BC-CAND-010 | FR-037 | NFR-013 |
| Preparar faturamento | BC-CAND-011 | FR-038 | NFR-011 |
| Registrar nota informada | BC-CAND-012 | FR-039 | NFR-011 |
| Registrar pagamento | BC-CAND-013 | — | NFR-011 |
| Registrar documento / substituir | BC-CAND-014 | FR-041, FR-042 | NFR-009 |
| Exportar relatório | BC-CAND-016 | UC-026 | SAFE_REPEAT |

Comandos de **autorização** validados em BC-CAND-001; efeito de negócio no BC da operação.
