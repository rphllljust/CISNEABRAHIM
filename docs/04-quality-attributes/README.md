# QATTR-INDEX-001

| Campo | Valor |
| --- | --- |
| Document ID | Atributos de qualidade — índice |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Prompt | 03 |
| Escopo | Requisitos não funcionais e cenários de qualidade |

> Derivado de SRC-001 (contexto reconstruído). Nenhum NFR empresarial `CONFIRMED`. Nenhuma meta numérica inventada.

## Arquivos desta pasta

| Arquivo | Conteúdo |
| --- | --- |
| [quality-attribute-method.md](./quality-attribute-method.md) | Método, classificação e status |
| [non-functional-requirements-register.md](./non-functional-requirements-register.md) | Registro principal de NFRs (40) |
| [quality-attribute-scenarios.md](./quality-attribute-scenarios.md) | Cenários QA-SC (28) |
| [security-requirements.md](./security-requirements.md) | Requisitos de segurança classificados (24) |
| [privacy-and-data-protection-requirements.md](./privacy-and-data-protection-requirements.md) | Privacidade e proteção de dados candidata |
| [reliability-and-resilience-requirements.md](./reliability-and-resilience-requirements.md) | Confiabilidade e resiliência |
| [availability-requirements.md](./availability-requirements.md) | Disponibilidade (targets pendentes) |
| [performance-and-capacity-requirements.md](./performance-and-capacity-requirements.md) | Performance e capacidade (medição futura) |
| [data-integrity-requirements.md](./data-integrity-requirements.md) | Integridade e consistência por operação |
| [concurrency-and-idempotency-requirements.md](./concurrency-and-idempotency-requirements.md) | Concorrência, idempotência e repetição |
| [auditability-and-accountability-requirements.md](./auditability-and-accountability-requirements.md) | Auditoria empresarial vs trilhas técnicas |
| [observability-requirements.md](./observability-requirements.md) | Logs, métricas, traces e alertas candidatos |
| [recoverability-requirements.md](./recoverability-requirements.md) | Backup, restore e continuidade |
| [retention-and-disposal-requirements.md](./retention-and-disposal-requirements.md) | Retenção e descarte |
| [maintainability-and-evolvability-requirements.md](./maintainability-and-evolvability-requirements.md) | Manutenibilidade e evolução |
| [testability-requirements.md](./testability-requirements.md) | Testabilidade |
| [compatibility-and-accessibility-requirements.md](./compatibility-and-accessibility-requirements.md) | Compatibilidade e acessibilidade |
| [deployment-and-environment-requirements.md](./deployment-and-environment-requirements.md) | Ambientes e implantação (sem stack) |
| [quality-attribute-tradeoffs.md](./quality-attribute-tradeoffs.md) | Trade-offs explícitos |
| [non-functional-open-questions.md](./non-functional-open-questions.md) | Questões abertas NFNQ (18) |
| [non-functional-traceability.md](./non-functional-traceability.md) | Matriz de rastreabilidade NFR |
| [prompt-03-completeness-report.md](./prompt-03-completeness-report.md) | Relatório de completude |

## Cadeia de rastreabilidade

```text
SOURCE (SRC-001)
→ EVIDENCE (EV-*)
→ BUSINESS RULE CANDIDATE (BR-*)
→ FUNCTIONAL REQUIREMENT (FR-*)
→ NON-FUNCTIONAL REQUIREMENT (NFR-*)
→ QUALITY SCENARIO (QA-SC-*)
→ RISK (RISK-*)
→ DOMAIN DECISION PENDING (DDP-*)
```

## Restrições desta etapa

- RPO / RTO: `TARGET_PENDING` (DDP-016)
- Metas numéricas de performance, disponibilidade, volume e retenção: `TARGET_PENDING`
- Obrigações legais de privacidade: `PENDING_LEGAL_VALIDATION`
- Tecnologia, stack, algoritmos e ferramentas: **não escolhidos**
