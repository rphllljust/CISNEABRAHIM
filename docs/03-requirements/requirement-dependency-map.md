# REQ-DEP-001

| Campo             | Valor                                 |
| ----------------- | ------------------------------------- |
| Document ID       | Mapa de dependências entre requisitos |
| Fonte             | SRC-001                               |
| Status documental | CANDIDATE — sem fonte primária        |
| Gerado em         | 2026-08-28                            |
| Prompt            | 02, 03 (atualizado)                   |
| Última revisão    | Prompt 03 — cadeia NFR                |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.

## Dependências funcionais (FR)

| Origem | Relação        | Destino | Justificativa                                                  |
| ------ | -------------- | ------- | -------------------------------------------------------------- |
| FR-009 | REQUIRES       | FR-001  | Conversão exige solicitação registrada                         |
| FR-009 | REQUIRES       | FR-008  | Conversão exige ausência de duplicidade                        |
| FR-009 | BLOCKED_BY     | FR-006  | Conversão pode depender de aprovação — DDP-002                 |
| FR-014 | REQUIRES       | FR-010  | Liberação exige OS criada                                      |
| FR-014 | REQUIRES       | FR-011  | Liberação pode exigir conteúdo preparado — DDP-003             |
| FR-017 | REQUIRES       | FR-014  | Execução exige liberação                                       |
| FR-018 | REQUIRES       | FR-017  | Progresso exige início de execução                             |
| FR-019 | REQUIRES       | FR-018  | Conclusão exige execução registrada                            |
| FR-025 | REQUIRES       | FR-013  | Alocação exige planejamento                                    |
| FR-027 | ENABLES        | FR-035  | Quantidade realizada alimenta medição candidata                |
| FR-035 | REQUIRES       | FR-018  | Medição exige execução elegível                                |
| FR-036 | REQUIRES       | FR-035  | Submissão exige medição preparada                              |
| FR-037 | REQUIRES       | FR-036  | Decisão exige submissão quando fluxo existir                   |
| FR-039 | OPTIONAL_AFTER | FR-037  | Faturamento pode depender de medição aprovada — DDP-011        |
| FR-039 | REQUIRES       | FR-038  | Registro exige origem identificável quando regra aplicável     |
| FR-033 | REQUIRES       | FR-029  | Controle de PO exige vínculo comercial                         |
| FR-032 | REFINES        | FR-031  | Restrição de visualização refinada sobre distinção custo/preço |
| FR-040 | REQUIRES       | FR-018  | Evidência exige execução em andamento ou concluída             |
| FR-042 | REQUIRES       | FR-041  | Controle de substituição exige documento lógico                |
| FR-021 | BLOCKED_BY     | DDP-005 | Reabertura bloqueada até decisão empresarial                   |
| FR-020 | CONFLICTS_WITH | FR-019  | Cancelamento e conclusão são mutuamente exclusivos em estado   |
| FR-028 | ENABLES        | FR-025  | Detecção de conflito suporta alocação segura                   |
| FR-034 | ENABLES        | FR-033  | Divergência pode afetar consumo de PO                          |
| FR-022 | ENABLES        | FR-011  | Histórico suporta auditoria de alterações de conteúdo          |

## Dependências não funcionais (NFR)

| Origem           | Relação          | Destino                   | Justificativa                                 |
| ---------------- | ---------------- | ------------------------- | --------------------------------------------- |
| FR-001           | QUALITY_REQUIRES | NFR-002                   | Idempotência na criação de solicitação        |
| FR-009           | QUALITY_REQUIRES | NFR-003                   | Idempotência na conversão solicitação → OS    |
| FR-014           | QUALITY_REQUIRES | NFR-004, NFR-007          | Integridade e autorização na liberação        |
| FR-022           | QUALITY_REQUIRES | NFR-001, NFR-006          | Concorrência e histórico de OS                |
| FR-025           | QUALITY_REQUIRES | NFR-005                   | Alocação exclusiva de recurso                 |
| FR-032           | QUALITY_REQUIRES | NFR-008                   | Proteção de custo e margem                    |
| FR-038, FR-039   | QUALITY_REQUIRES | NFR-011                   | Integridade financeira e idempotência         |
| FR-037           | QUALITY_REQUIRES | NFR-013                   | SoD em decisão de medição                     |
| FR-030           | QUALITY_REQUIRES | NFR-012                   | Integração sem sucesso local falso            |
| FR-042           | QUALITY_REQUIRES | NFR-009, NFR-010          | Versão documental e acesso restrito           |
| NFR-023          | DEPENDS_ON       | DDP-040                   | Disponibilidade — janela operacional pendente |
| NFR-027, NFR-028 | BLOCKED_BY       | DDP-016                   | RPO/RTO sem fonte primária                    |
| NFR-032..035     | BLOCKED_BY       | DDP-036, DDP-017          | Performance sem baseline                      |
| NFR-037..039     | BLOCKED_BY       | DDP-019, DDP-039          | Retenção e privacidade pendentes              |
| NFR-001..005     | TRACE_TO         | QA-SC-001..005            | Cenários de concorrência e idempotência       |
| NFR-025..028     | TRACE_TO         | QA-SC-021, QA-SC-022      | Recuperação e restore                         |
| RISK-003         | MITIGATED_BY     | NFR-001, NFR-006          | Lost update e histórico                       |
| RISK-004         | MITIGATED_BY     | NFR-002, NFR-003, NFR-011 | Duplicidade operacional e financeira          |
| RISK-010         | MITIGATED_BY     | NFR-012, NFR-024          | Falha de integração                           |
| RISK-011         | MITIGATED_BY     | NFR-025..028              | Continuidade e backup                         |
| RISK-020         | MITIGATED_BY     | NFR-008, NFR-021          | Vazamento de custo/margem                     |
| RISK-024         | MITIGATED_BY     | NFR-029                   | Trilha de segurança vs log técnico            |

Índice NFR: [`../04-quality-attributes/non-functional-requirements-register.md`](../04-quality-attributes/non-functional-requirements-register.md).

Cadeia completa: [`../04-quality-attributes/nfr-risk-traceability.md`](../04-quality-attributes/nfr-risk-traceability.md).
