# QATTR-INDEX-002

| Campo             | Valor                                             |
| ----------------- | ------------------------------------------------- |
| Document ID       | Atributos de qualidade — índice                   |
| Fonte             | SRC-001                                           |
| Status documental | CANDIDATE — sem fonte primária                    |
| Gerado em         | 2026-08-28                                        |
| Prompt            | 03 (revisão estrutural)                           |
| Escopo            | Requisitos não funcionais e cenários de qualidade |

> Derivado de SRC-001 (contexto reconstruído). Nenhum NFR empresarial `CONFIRMED`. Nenhuma meta numérica inventada.

## Arquivos desta pasta (24)

| Arquivo                                                                              | Conteúdo                                   |
| ------------------------------------------------------------------------------------ | ------------------------------------------ |
| [nfr-method.md](./nfr-method.md)                                                     | Método, classificação, status e trade-offs |
| [non-functional-requirements-register.md](./non-functional-requirements-register.md) | Registro principal de NFRs (40)            |
| [quality-attribute-scenarios.md](./quality-attribute-scenarios.md)                   | Cenários QA-SC (28)                        |
| [security-requirements.md](./security-requirements.md)                               | Requisitos de segurança (24 SEC-REQ)       |
| [reliability-and-resilience.md](./reliability-and-resilience.md)                     | Confiabilidade e resiliência               |
| [availability-requirements.md](./availability-requirements.md)                       | Disponibilidade                            |
| [performance-and-capacity.md](./performance-and-capacity.md)                         | Performance e capacidade                   |
| [scalability-requirements.md](./scalability-requirements.md)                         | Escalabilidade                             |
| [data-integrity-and-consistency.md](./data-integrity-and-consistency.md)             | Integridade e consistência                 |
| [concurrency-and-idempotency-quality.md](./concurrency-and-idempotency-quality.md)   | Concorrência e idempotência                |
| [auditability-and-accountability.md](./auditability-and-accountability.md)           | Auditoria empresarial vs técnica           |
| [observability-requirements.md](./observability-requirements.md)                     | Observabilidade candidata                  |
| [recoverability-and-continuity.md](./recoverability-and-continuity.md)               | Backup, restore e continuidade             |
| [privacy-and-data-protection.md](./privacy-and-data-protection.md)                   | Privacidade e proteção de dados            |
| [retention-and-disposal.md](./retention-and-disposal.md)                             | Retenção e descarte                        |
| [maintainability-and-evolvability.md](./maintainability-and-evolvability.md)         | Manutenibilidade                           |
| [testability-requirements.md](./testability-requirements.md)                         | Testabilidade                              |
| [usability-and-accessibility.md](./usability-and-accessibility.md)                   | Usabilidade e acessibilidade               |
| [compatibility-and-deployment.md](./compatibility-and-deployment.md)                 | Compatibilidade e implantação              |
| [nfr-risk-traceability.md](./nfr-risk-traceability.md)                               | Matriz NFR ↔ risco ↔ teste futuro          |
| [service-level-objectives-pending.md](./service-level-objectives-pending.md)         | SLOs pendentes (sem valores)               |
| [nfr-open-questions.md](./nfr-open-questions.md)                                     | Questões abertas NFNQ (18)                 |
| [prompt-03-completeness-report.md](./prompt-03-completeness-report.md)               | Relatório de completude                    |

## Cadeia de rastreabilidade

```text
SOURCE (SRC-001)
→ EVIDENCE (EV-*)
→ BUSINESS RULE CANDIDATE (BR-*)
→ FUNCTIONAL REQUIREMENT (FR-*)
→ USE CASE (UC-*)
→ NON-FUNCTIONAL REQUIREMENT (NFR-*)
→ QUALITY SCENARIO (QA-SC-*)
→ RISK (RISK-*)
→ FUTURE TEST (TBD)
```

## Totais recalculados (Prompt 02 + 03)

| Artefato                     | Quantidade |
| ---------------------------- | ---------- |
| FR                           | 42         |
| UC                           | 26         |
| Risco (RISK)                 | 24         |
| DDP                          | 40         |
| NFR                          | 40         |
| QA-SC                        | 28         |
| SEC-REQ                      | 24         |
| NFNQ                         | 18         |
| NFR CONFIRMED                | 0          |
| Targets numéricos inventados | 0          |

## Histórico de nomenclatura

A primeira execução do Prompt 03 usou sufixo `-requirements` em vários arquivos e `quality-attribute-method.md`. Esta revisão alinha nomes ao protocolo atual sem apagar histórico Git.
