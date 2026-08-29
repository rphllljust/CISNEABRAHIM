# Documentação — SISTEMA CISNE RONDÔNIA

Índice da baseline documental. Fase atual: **FOUNDATION**. Código funcional: **NOT STARTED**.

## Como usar esta pasta

1. Governança (`00-governance/`) define como o trabalho é feito.
2. Fundação (`01-foundation/`) registra o que se sabe, o que falta e o que está pendente.
3. `inputs/` recebe fontes empresariais. SRC-001 disponível desde Prompt 00.1; analisado no Prompt 01.
4. `02-source-analysis/` contém decomposição atômica e análises do Prompt 01.
5. `03-requirements/` contém requisitos funcionais e casos de uso do Prompt 02.
6. `04-quality-attributes/` contém requisitos não funcionais do Prompt 03.
7. `05-ubiquitous-language/` contém glossário e linguagem ubíqua do Prompt 04.
8. `06-domain-boundaries/` contém subdomínios e bounded contexts candidatos do Prompt 05.
9. `07-domain-behavior/` contém invariantes, comandos e eventos candidatos do Prompt 06.
10. `templates/` define a forma dos registros futuros.

Agentes devem seguir [`../AGENTS.md`](../AGENTS.md) e o protocolo em [`00-governance/execution-protocol.md`](00-governance/execution-protocol.md).

## 00-governance

| Arquivo | Conteúdo |
| --- | --- |
| [project-charter.md](00-governance/project-charter.md) | Carta do projeto |
| [execution-protocol.md](00-governance/execution-protocol.md) | Protocolo de execução dos prompts |
| [engineering-principles.md](00-governance/engineering-principles.md) | Princípios de engenharia |
| [change-governance.md](00-governance/change-governance.md) | Governança de mudança e commits |
| [traceability-policy.md](00-governance/traceability-policy.md) | Política de rastreabilidade |
| [definition-of-ready.md](00-governance/definition-of-ready.md) | Definition of Ready |
| [definition-of-done.md](00-governance/definition-of-done.md) | Definition of Done |
| [quality-gates.md](00-governance/quality-gates.md) | Quality gates |
| [prompt-roadmap.md](00-governance/prompt-roadmap.md) | Roadmap preliminar de prompts |
| [prompt-execution-log.md](00-governance/prompt-execution-log.md) | Registro de execução |

## 01-foundation

| Arquivo | Conteúdo |
| --- | --- |
| [source-registry.md](01-foundation/source-registry.md) | Registro de fontes |
| [business-context.md](01-foundation/business-context.md) | Contexto empresarial preliminar |
| [scope-register.md](01-foundation/scope-register.md) | Registro de escopo |
| [stakeholders-register.md](01-foundation/stakeholders-register.md) | Partes interessadas |
| [business-rules-register.md](01-foundation/business-rules-register.md) | Regras de negócio |
| [domain-decisions-pending.md](01-foundation/domain-decisions-pending.md) | Decisões de domínio pendentes |
| [engineering-decisions-register.md](01-foundation/engineering-decisions-register.md) | Decisões de engenharia |
| [source-conflicts.md](01-foundation/source-conflicts.md) | Conflitos de fonte |
| [risk-register.md](01-foundation/risk-register.md) | Registro de riscos |
| [requirements-traceability.md](01-foundation/requirements-traceability.md) | Matriz de rastreabilidade |

## 02-source-analysis

Análise atômica e temática das fontes (Prompt 01). Índice: [02-source-analysis/README.md](02-source-analysis/README.md).

| Arquivo | Conteúdo |
| --- | --- |
| [atomic-evidence-register.md](02-source-analysis/atomic-evidence-register.md) | 84 evidências EV-001–EV-084 |
| [source-assessment.md](02-source-analysis/source-assessment.md) | Avaliação SRC-000 e SRC-001 |
| [prompt-01-completeness-report.md](02-source-analysis/prompt-01-completeness-report.md) | Relatório de completude |

## 03-requirements

Requisitos funcionais e casos de uso (Prompt 02). Índice: [03-requirements/README.md](03-requirements/README.md).

| Arquivo | Conteúdo |
| --- | --- |
| [functional-requirements-register.md](03-requirements/functional-requirements-register.md) | 42 FRs FR-001..FR-042 |
| [use-case-catalog.md](03-requirements/use-case-catalog.md) | 26 UCs UC-001..UC-026 |
| [acceptance-criteria-catalog.md](03-requirements/acceptance-criteria-catalog.md) | 52 ACs AC-001..AC-052 |
| [business-capability-map.md](03-requirements/business-capability-map.md) | 27 capacidades candidatas |
| [prompt-02-completeness-report.md](03-requirements/prompt-02-completeness-report.md) | Relatório de completude |

## 04-quality-attributes

Requisitos não funcionais e cenários de qualidade (Prompt 03). Índice: [04-quality-attributes/README.md](04-quality-attributes/README.md).

| Arquivo | Conteúdo |
| --- | --- |
| [nfr-method.md](04-quality-attributes/nfr-method.md) | Método e classificação NFR |
| [non-functional-requirements-register.md](04-quality-attributes/non-functional-requirements-register.md) | 40 NFRs NFR-001..NFR-040 |
| [quality-attribute-scenarios.md](04-quality-attributes/quality-attribute-scenarios.md) | 28 cenários QA-SC-001..QA-SC-028 |
| [security-requirements.md](04-quality-attributes/security-requirements.md) | 24 SEC-REQ |
| [service-level-objectives-pending.md](04-quality-attributes/service-level-objectives-pending.md) | SLOs pendentes (sem valores) |
| [nfr-risk-traceability.md](04-quality-attributes/nfr-risk-traceability.md) | Rastreabilidade NFR ↔ risco |
| [prompt-03-completeness-report.md](04-quality-attributes/prompt-03-completeness-report.md) | Relatório de completude |

## 05-ubiquitous-language

Glossário e linguagem ubíqua (Prompt 04). Índice: [05-ubiquitous-language/README.md](05-ubiquitous-language/README.md).

| Arquivo | Conteúdo |
| --- | --- |
| [language-method.md](05-ubiquitous-language/language-method.md) | Método e classes semânticas |
| [ubiquitous-language-register.md](05-ubiquitous-language/ubiquitous-language-register.md) | 48 termos TERM-001..TERM-048 |
| [business-verbs-catalog.md](05-ubiquitous-language/business-verbs-catalog.md) | Verbos empresariais |
| [business-nouns-catalog.md](05-ubiquitous-language/business-nouns-catalog.md) | Substantivos empresariais |
| [state-event-command-semantics.md](05-ubiquitous-language/state-event-command-semantics.md) | Estado, evento, comando |
| [language-consistency-audit.md](05-ubiquitous-language/language-consistency-audit.md) | Auditoria terminológica |
| [prompt-04-completeness-report.md](05-ubiquitous-language/prompt-04-completeness-report.md) | Relatório de completude |

## 06-domain-boundaries

Subdomínios e bounded contexts candidatos (Prompt 05). Índice: [06-domain-boundaries/README.md](06-domain-boundaries/README.md).

| Arquivo | Conteúdo |
| --- | --- |
| [subdomain-classification.md](06-domain-boundaries/subdomain-classification.md) | 12 subdomínios SUBD-001..012 |
| [bounded-context-candidates.md](06-domain-boundaries/bounded-context-candidates.md) | 18 BC-CAND-001..018 |
| [context-map.md](06-domain-boundaries/context-map.md) | Mapa de contextos |
| [cross-context-workflows.md](06-domain-boundaries/cross-context-workflows.md) | Fluxos transversais |
| [modular-monolith-assessment.md](06-domain-boundaries/modular-monolith-assessment.md) | Avaliação modular monolith |
| [prompt-05-completeness-report.md](06-domain-boundaries/prompt-05-completeness-report.md) | Relatório de completude |

## 07-domain-behavior

Comportamento de domínio candidato (Prompt 06). Índice: [07-domain-behavior/README.md](07-domain-behavior/README.md).

| Arquivo | Conteúdo |
| --- | --- |
| [invariant-register.md](07-domain-behavior/invariant-register.md) | 22 INV-001..INV-022 |
| [command-register.md](07-domain-behavior/command-register.md) | 22 CMD-001..CMD-022 |
| [domain-event-register.md](07-domain-behavior/domain-event-register.md) | 20 DE-001..DE-020 |
| [rejection-reason-catalog.md](07-domain-behavior/rejection-reason-catalog.md) | 18 REJ |
| [behavior-traceability.md](07-domain-behavior/behavior-traceability.md) | Cadeia EV→DE |
| [prompt-06-completeness-report.md](07-domain-behavior/prompt-06-completeness-report.md) | Relatório |

## inputs

Área segura para inclusão futura de fontes. Ver [inputs/README.md](inputs/README.md).

## templates

| Arquivo | Uso |
| --- | --- |
| [source-template.md](templates/source-template.md) | Nova fonte |
| [business-rule-template.md](templates/business-rule-template.md) | Nova regra |
| [domain-decision-template.md](templates/domain-decision-template.md) | Decisão de domínio |
| [engineering-decision-template.md](templates/engineering-decision-template.md) | Decisão de engenharia |
| [source-conflict-template.md](templates/source-conflict-template.md) | Conflito de fonte |
| [risk-template.md](templates/risk-template.md) | Risco |
| [prompt-completion-template.md](templates/prompt-completion-template.md) | Encerramento de prompt |
