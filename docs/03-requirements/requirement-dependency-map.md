# REQ-DEP-001

| Campo | Valor |
| --- | --- |
| Document ID | Mapa de dependências entre requisitos |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Prompt | 02 |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
| Origem | Relação | Destino | Justificativa |
| --- | --- | --- | --- |
| FR-009 | REQUIRES | FR-001 | Conversão exige solicitação registrada |
| FR-009 | REQUIRES | FR-008 | Conversão exige ausência de duplicidade |
| FR-009 | BLOCKED_BY | FR-006 | Conversão pode depender de aprovação — DDP-002 |
| FR-014 | REQUIRES | FR-010 | Liberação exige OS criada |
| FR-014 | REQUIRES | FR-011 | Liberação pode exigir conteúdo preparado — DDP-003 |
| FR-017 | REQUIRES | FR-014 | Execução exige liberação |
| FR-018 | REQUIRES | FR-017 | Progresso exige início de execução |
| FR-019 | REQUIRES | FR-018 | Conclusão exige execução registrada |
| FR-025 | REQUIRES | FR-013 | Alocação exige planejamento |
| FR-027 | ENABLES | FR-035 | Quantidade realizada alimenta medição candidata |
| FR-035 | REQUIRES | FR-018 | Medição exige execução elegível |
| FR-036 | REQUIRES | FR-035 | Submissão exige medição preparada |
| FR-037 | REQUIRES | FR-036 | Decisão exige submissão quando fluxo existir |
| FR-039 | OPTIONAL_AFTER | FR-037 | Faturamento pode depender de medição aprovada — DDP-011 |
| FR-039 | REQUIRES | FR-038 | Registro exige origem identificável quando regra aplicável |
| FR-033 | REQUIRES | FR-029 | Controle de PO exige vínculo comercial |
| FR-032 | REFINES | FR-031 | Restrição de visualização refinada sobre distinção custo/preço |
| FR-040 | REQUIRES | FR-018 | Evidência exige execução em andamento ou concluída |
| FR-042 | REQUIRES | FR-041 | Controle de substituição exige documento lógico |
| FR-021 | BLOCKED_BY | DDP-005 | Reabertura bloqueada até decisão empresarial |
| FR-020 | CONFLICTS_WITH | FR-019 | Cancelamento e conclusão são mutuamente exclusivos em estado |
| FR-028 | ENABLES | FR-025 | Detecção de conflito suporta alocação segura |
| FR-034 | ENABLES | FR-033 | Divergência pode afetar consumo de PO |
| FR-022 | ENABLES | FR-011 | Histórico suporta auditoria de alterações de conteúdo |
