# DBND-RESP-MATRIX-001

| Campo | Valor |
| --- | --- |
| Document ID | Matriz de responsabilidade por contexto |
| Prompt | 05 |

## FR / UC → contexto owner (primário)

| Artefato | Descrição | BC owner | SUBD |
| --- | --- | --- | --- |
| FR-001..FR-007, UC-001..004 | Solicitação | BC-CAND-005 | SUBD-001 |
| FR-008, FR-009, UC-005 | Conversão solicitação→OS | BC-CAND-006 (+ evento de BC-005) | SUBD-001/002 |
| FR-010..FR-014, UC-006, UC-008 | Preparação e liberação OS | BC-CAND-006 | SUBD-002 |
| FR-015, FR-016, UC-009 | Responsável e confirmação | BC-CAND-006 | SUBD-002 |
| FR-017..FR-021, UC-010..013 | Execução ciclo OS | BC-CAND-008 (+ estado em BC-006) | SUBD-004 |
| FR-022, UC-014 | Histórico OS | BC-CAND-017 (+ BC-006) | SUBD-008 |
| FR-023..FR-028, UC-015 | Recursos e alocação | BC-CAND-007 | SUBD-003 |
| FR-029..FR-034, UC-017, UC-019, UC-020 | Comercial e PO | BC-CAND-003, BC-CAND-004 | SUBD-005 |
| FR-031, FR-032, UC-018 | Preço/custo/margem | BC-CAND-003 | SUBD-005 |
| FR-035..FR-037, UC-021, UC-022 | Medição | BC-CAND-010 | SUBD-006 |
| FR-038, FR-039, UC-023 | Faturamento e nota | BC-CAND-011, BC-CAND-012 | SUBD-006 |
| FR-040, UC-024 | Evidência execução | BC-CAND-009 | SUBD-004 |
| FR-041, FR-042, UC-025 | Documentos | BC-CAND-014 | SUBD-007 |
| UC-026 | Relatórios | BC-CAND-016 | SUBD-010 |

## Responsabilidades transversais

| Responsabilidade | Concept owner | Decision owner | BC |
| --- | --- | --- | --- |
| Autorização empresarial | SUBD-008 | Autorizador (papel) | BC-CAND-001 |
| Auditoria alterações | SUBD-008 | Direção / auditoria | BC-CAND-017 |
| Integração ERP | SUBD-009 | Comercial / TI | BC-CAND-018 |
| Notificação | SUBD-011 | Operacional | BC-CAND-015 |

Nenhum FR sem BC primário atribuído. FRs transversais de autorização consultam BC-CAND-001 sem absorver regra de negócio da OS.
