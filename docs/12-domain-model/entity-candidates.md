# DM-ENT-001

| Campo | Valor |
| --- | --- |
| Document ID | Entidades candidatas |
| Total | 26 (ENTITY-CAND-001..026) |
| Prompt | 11 |

> Entidade = identidade própria dentro ou fora de aggregate.

| ID | Nome | AGG / BC | TERM | Status |
| --- | --- | --- | --- | --- |
| ENTITY-CAND-001 | SolicitaçãoDeServiço | AGG-001 / BC-005 | TERM-001 | ACCEPTED_FOR_LOGICAL_MODELING |
| ENTITY-CAND-002 | OrdemDeServiço | AGG-002 / BC-006 | TERM-002 | ACCEPTED_FOR_LOGICAL_MODELING |
| ENTITY-CAND-003 | ItemPlanejadoOS | AGG-002 (filho) | TERM-023 | CANDIDATE |
| ENTITY-CAND-004 | RegistroHistoricoOS | AGG-002 ou BC-017 | TERM-044 | PENDING_BUSINESS_DECISION |
| ENTITY-CAND-005 | AlocaçãoRecurso | AGG-003 / BC-007 | TERM-030 | CANDIDATE |
| ENTITY-CAND-006 | RegistroExecução | AGG-004 / BC-008 | — | CANDIDATE |
| ENTITY-CAND-007 | RegistroProgressoExecução | AGG-004 (filho) | TERM-024 | CANDIDATE |
| ENTITY-CAND-008 | VínculoEvidênciaExecução | AGG-005 / BC-009 | TERM-034 | CANDIDATE |
| ENTITY-CAND-009 | Medição | AGG-006 / BC-010 | TERM-016 | CANDIDATE |
| ENTITY-CAND-010 | LinhaMedição | AGG-006 (filho) | — | CANDIDATE |
| ENTITY-CAND-011 | PreparaçãoFaturamento | AGG-007 / BC-011 | TERM-017 | CANDIDATE |
| ENTITY-CAND-012 | ItemFaturável | AGG-007 (filho) | TERM-040 | CANDIDATE |
| ENTITY-CAND-013 | DocumentoFaturamentoInformado | AGG-008 / BC-012 | TERM-018 | CANDIDATE |
| ENTITY-CAND-014 | RegistroPagamento | AGG-009 / BC-013 | TERM-019 | PENDING_BUSINESS_DECISION |
| ENTITY-CAND-015 | DocumentoLógico | AGG-013 / BC-014 | TERM-031 | CANDIDATE |
| ENTITY-CAND-016 | VersãoDocumental | AGG-013 (filho) | TERM-032 | CANDIDATE |
| ENTITY-CAND-017 | PedidoCompra | AGG-010 / BC-004 | TERM-013 | PENDING_BUSINESS_DECISION |
| ENTITY-CAND-018 | ItemPedidoCompra | AGG-010 (filho) | — | PENDING_BUSINESS_DECISION |
| ENTITY-CAND-019 | ReferênciaComercial | AGG-011 / BC-003 | TERM-015 | CANDIDATE |
| ENTITY-CAND-020 | PartyCliente | AGG-012 / BC-002 | TERM-004 | CANDIDATE |
| ENTITY-CAND-021 | EntregaNotificação | AGG-014 / BC-015 | — | CANDIDATE |
| ENTITY-CAND-022 | ResponsabilidadeOS | AGG-002 (filho?) ou VO | TERM-008 | PENDING_BUSINESS_DECISION |
| ENTITY-CAND-023 | ConsumoPO | AGG-010 (filho?) | — | PENDING_BUSINESS_DECISION |
| ENTITY-CAND-024 | SessãoAtor | BC-001 | — | CANDIDATE — fora escopo AGG core |
| ENTITY-CAND-025 | EntradaHistóricoDomínio | BC-017 | TERM-044 | CANDIDATE — append-only |
| ENTITY-CAND-026 | StagingIntegração | BC-018 | TERM-048 | CANDIDATE — EXT-REC |

## Não promovidos a entidade

| Conceito | Classificação |
| --- | --- |
| Margem | VO derivado ou cálculo — VO-CAND-012 |
| Estado OS | Atributo root + SM-CAND-002 |
| Arquivo binário | Metadado em VersãoDocumental — VO-CAND-020 |
