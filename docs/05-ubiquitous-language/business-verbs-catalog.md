# UL-VERB-CAT-001

| Campo | Valor |
| --- | --- |
| Document ID | Catálogo de verbos empresariais |
| Fonte | SRC-001 |
| Prompt | 04 |

> Verbos analisados como **comandos candidatos** ou ações de processo — não como nomes de API.

| Verbo (PT) | Classe semântica | TERM / FR | Evidência | Status | Notas |
| --- | --- | --- | --- | --- | --- |
| Registrar (solicitação) | COMMAND_VERB | TERM-001; FR-001 | EV-027 | ACCEPTED_FOR_DOCUMENTATION | Distinto de converter |
| Converter | COMMAND_VERB | TERM-045; FR-009 | EV-028 | ACCEPTED_FOR_DOCUMENTATION | Solicitação → OS |
| Aprovar | COMMAND_VERB | TERM-046; FR-006 | EV-038 | AMBIGUOUS | Alçada e objeto TBD |
| Rejeitar | COMMAND_VERB | TERM-046; FR-006 | EV-038 | AMBIGUOUS | Par solicitação/medição |
| Liberar | COMMAND_VERB | TERM-010; FR-014 | EV-039 | AMBIGUOUS | ≠ aprovar; critérios DDP-029 |
| Atribuir (responsável) | COMMAND_VERB | TERM-008; FR-015 | EV-084 | AMBIGUOUS | Estado vs evento DDP-032 |
| Receber (confirmação) | COMMAND_VERB | FR-016 | EV-016 | PENDING_BUSINESS_DECISION | ≠ aceitar formalmente |
| Entregar | COMMAND_VERB | — | EV-045 | UNKNOWN | Não formalizado como TERM |
| Visualizar | COMMAND_VERB | FR-016 | EV-073 | AMBIGUOUS | VIEWED — evento ou estado |
| Confirmar | COMMAND_VERB | FR-016 | EV-016 | AMBIGUOUS | vs ACKNOWLEDGED |
| Aceitar | COMMAND_VERB | — | EV-084 | AMBIGUOUS | vs ACKNOWLEDGED / ACCEPTED |
| Iniciar (execução) | COMMAND_VERB | FR-017 | EV-044 | ACCEPTED_FOR_DOCUMENTATION | STARTED candidato |
| Executar | COMMAND_VERB | TERM-006; FR-017..FR-018 | EV-037 | PENDING_BUSINESS_DECISION | Executor formal TBD |
| Pausar | COMMAND_VERB | — | — | UNKNOWN | Não evidenciado em SRC-001 |
| Interromper | COMMAND_VERB | — | EV-046 | UNKNOWN | Possível sinônimo informal de pausar |
| Concluir | COMMAND_VERB | FR-019 | EV-045 | ACCEPTED_FOR_DOCUMENTATION | COMPLETED candidato |
| Cancelar | COMMAND_VERB | FR-020 | EV-046 | ACCEPTED_FOR_DOCUMENTATION | Mutuamente exclusivo com concluir |
| Reabrir | COMMAND_VERB | FR-021 | EV-046 | PENDING_BUSINESS_DECISION | DDP-005 |
| Encerrar | COMMAND_VERB | — | EV-045 | AMBIGUOUS | vs concluir vs cancelar |
| Alocar (recurso) | COMMAND_VERB | TERM-030; FR-025 | EV-051 | ACCEPTED_FOR_DOCUMENTATION | ALLOCATED candidato |
| Medir | COMMAND_VERB | TERM-016; FR-035..FR-036 | EV-062 | AMBIGUOUS | Processo vs entidade DDP-010 |
| Faturar (registrar) | COMMAND_VERB | TERM-017; FR-039 | EV-064 | AMBIGUOUS | Registro, não emissão fiscal |
| Substituir (documento) | COMMAND_VERB | TERM-043; FR-042 | EV-082 | ACCEPTED_FOR_DOCUMENTATION | Preserva versão anterior |
| Decidir (medição) | COMMAND_VERB | TERM-047; FR-037 | EV-063 | ACCEPTED_FOR_DOCUMENTATION | SoD candidata |
| Registrar (pagamento) | COMMAND_VERB | TERM-019 | EV-064 | PENDING_BUSINESS_DECISION | SoT DDP-012 |
| Anexar (evidência) | COMMAND_VERB | TERM-034; FR-040 | EV-069 | ACCEPTED_FOR_DOCUMENTATION | Upload = termo técnico |

**Total verbos analisados:** 26 (lista obrigatória Prompt 04 coberta; pausar/interromper sem evidência direta).

Detalhamento por domínio: [service-order-language.md](./service-order-language.md), [execution-and-evidence-language.md](./execution-and-evidence-language.md).
