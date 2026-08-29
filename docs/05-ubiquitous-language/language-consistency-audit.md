# UL-AUDIT-CONSISTENCY-001

| Campo | Valor |
| --- | --- |
| Document ID | Auditoria de consistência terminológica |
| Fonte | Cruzamento Prompt 01–04 |
| Prompt | 04 |
| Data | 2026-08-28 |

> Correções aplicadas somente quando inequívocas. Demais itens registrados para decisão.

## Correções documentais aplicadas nesta revisão

| Arquivo | Termo atual | Problema | Correção | Registro |
| --- | --- | --- | --- | --- |
| `ubiquitous-language-register.md` | PENDING_DISAMBIGUATION | Status fora do enum Prompt 04 revisado | → `AMBIGUOUS` | Execução log 04-REVISED |
| `ubiquitous-language-register.md` | PENDING_VALIDATION | Status fora do enum | → `PENDING_BUSINESS_DECISION` | Idem |
| `ubiquitous-language-register.md` | CANDIDATE (24 termos) | Distinção documentação vs confirmação | → `ACCEPTED_FOR_DOCUMENTATION` | Idem |
| `ambiguous-terms.md` | Sem link TERM | Rastreabilidade incompleta | Link para `05-ubiquitous-language/` | Esta revisão |

## Inconsistências registradas (sem correção em massa)

| Arquivo | Termo atual | Problema | Termo candidato | Impacto | Decisão necessária |
| --- | --- | --- | --- | --- | --- |
| `functional-requirements-register.md` | "usuário" em notas | Ator técnico vs empresarial | Solicitante / Autorizador | FR-006, FR-037 | DDP-015 |
| `non-functional-requirements-register.md` | TARGET_PENDING (histórico Git) | Terminologia NFR | TARGET_NOT_DEFINED | Leitura cruzada | Resolvido no commit faa6872 |
| `command-candidates.md` | ReleaseServiceOrder | Inglês como verbo preferencial | Liberar OS (TERM-010) | Prompt 09+ | Manter como candidato técnico |
| `domain-event-candidates.md` | ItemViewed | Estado ou evento | Visualizar / VIEWED | UC-009 | DDP-032 |
| `requirements-open-questions.md` | RQ sem GLQ | Duplicação glossário | Referência GLQ-001..012 | Rastreabilidade | Seção GLQ adicionada |
| `business-nouns-catalog.md` | RC | Ausente em SRC-001 | Não registrar TERM | Escopo | Aguardar fonte |
| `resource-language.md` | Equipamento / veículo | Sobreposição | TERM-025 vs TERM-026 | Alocação FR-025 | DDP-007, DDP-034 |
| `measurement-and-billing-language.md` | Faturamento | Processo vs registro | TERM-017 qualificado | FR-038, FR-039 | DDP-011, DDP-023 |
| `stakeholders-register.md` | Gestão | Ator vago EV-080 | Autorizador empresarial | Autorização | DDP-022 |
| `risk-register.md` | Lost update | Termo técnico em risco | Concorrência em OS (NFR-001) | NFR/QA-SC | Aceito como risco nomeado |

## Cobertura de rastreabilidade

```text
SOURCE → EVIDENCE → TERM → BR → FR → NFR → UC → DDP → FUTURE TEST (TBD)
```

| Artefato | Quantidade |
| --- | --- |
| TERM | 48 |
| ACCEPTED_FOR_DOCUMENTATION | 24 |
| AMBIGUOUS | 18 |
| PENDING_BUSINESS_DECISION | 6 |
| Ambiguidades AT-001 mapeadas | 38 |
| GLQ / validação pendente | 12 |

## Referências

- Registro: [ubiquitous-language-register.md](./ubiquitous-language-register.md)
- Matriz geral: [../01-foundation/requirements-traceability.md](../01-foundation/requirements-traceability.md)
