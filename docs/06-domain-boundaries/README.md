# DBND-INDEX-001

| Campo             | Valor                                      |
| ----------------- | ------------------------------------------ |
| Document ID       | Fronteiras de domínio — índice             |
| Fonte             | SRC-001                                    |
| Status documental | CANDIDATE — sem fonte primária             |
| Gerado em         | 2026-08-28                                 |
| Prompt            | 05                                         |
| Espaço            | PROBLEM_SPACE + SOLUTION_SPACE (separados) |

> Bounded context **candidato** ≠ microserviço ≠ pasta ≠ deployable. Nenhuma implementação autorizada.

## Arquivos (23)

| Arquivo                                                                        | Conteúdo                            |
| ------------------------------------------------------------------------------ | ----------------------------------- |
| [strategic-ddd-method.md](./strategic-ddd-method.md)                           | Método e separação problema/solução |
| [business-domain-overview.md](./business-domain-overview.md)                   | Visão do domínio empresarial        |
| [subdomain-classification.md](./subdomain-classification.md)                   | 12 subdomínios SUBD-001..012        |
| [bounded-context-candidates.md](./bounded-context-candidates.md)               | 18 contextos BC-CAND-001..018       |
| [capability-to-context-matrix.md](./capability-to-context-matrix.md)           | CAP → SUBD → BC                     |
| [context-responsibility-matrix.md](./context-responsibility-matrix.md)         | Responsabilidades por contexto      |
| [context-data-ownership.md](./context-data-ownership.md)                       | Autoridade de dados                 |
| [context-command-ownership.md](./context-command-ownership.md)                 | Comandos por contexto               |
| [context-event-ownership.md](./context-event-ownership.md)                     | Eventos por contexto                |
| [context-invariant-ownership.md](./context-invariant-ownership.md)             | Invariantes por contexto            |
| [context-map.md](./context-map.md)                                             | Mapa visual candidato               |
| [context-relationships.md](./context-relationships.md)                         | Relações DDD candidatas             |
| [cross-context-workflows.md](./cross-context-workflows.md)                     | Fluxos transversais                 |
| [source-of-truth-by-context.md](./source-of-truth-by-context.md)               | SoT por artefato                    |
| [integration-boundaries.md](./integration-boundaries.md)                       | Fronteiras de integração            |
| [shared-concept-analysis.md](./shared-concept-analysis.md)                     | Conceitos compartilhados            |
| [boundary-conflicts.md](./boundary-conflicts.md)                               | Conflitos de fronteira              |
| [modular-monolith-assessment.md](./modular-monolith-assessment.md)             | Avaliação modular monolith          |
| [extraction-readiness.md](./extraction-readiness.md)                           | Critérios futuros de extração       |
| [domain-boundary-decisions-pending.md](./domain-boundary-decisions-pending.md) | DBND-001..012                       |
| [domain-boundary-risks.md](./domain-boundary-risks.md)                         | Riscos de fronteira                 |
| [prompt-05-completeness-report.md](./prompt-05-completeness-report.md)         | Relatório de completude             |

## Cadeia de rastreabilidade

```text
CAPABILITY → SUBDOMAIN → BOUNDED CONTEXT CANDIDATE
BR / FR / UC → CONTEXT OWNER
DATA → AUTHORITATIVE CONTEXT
COMMAND / EVENT → CONTEXT OWNER
```

## Totais

| Artefato                              | Quantidade |
| ------------------------------------- | ---------- |
| Subdomínios (SUBD)                    | 12         |
| Bounded contexts candidatos (BC-CAND) | 18         |
| Capacidades mapeadas (CAP)            | 27         |
| Decisões pendentes (DBND)             | 12         |
| Microserviços / código                | **0**      |

## Referências

- Capacidades: [`../03-requirements/business-capability-map.md`](../03-requirements/business-capability-map.md)
- Linguagem: [`../05-ubiquitous-language/ubiquitous-language-register.md`](../05-ubiquitous-language/ubiquitous-language-register.md)
- NFRs: [`../04-quality-attributes/non-functional-requirements-register.md`](../04-quality-attributes/non-functional-requirements-register.md)
