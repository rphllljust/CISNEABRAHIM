# UL-INDEX-002

| Campo             | Valor                          |
| ----------------- | ------------------------------ |
| Document ID       | Linguagem ubíqua — índice      |
| Fonte             | SRC-001                        |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em         | 2026-08-28                     |
| Prompt            | 04 (revisão estrutural)        |
| Total termos      | 48 (TERM-001..TERM-048)        |

> Glossário derivado de SRC-001. `ACCEPTED_FOR_DOCUMENTATION` **não** significa regra confirmada.

## Arquivos (22)

| Arquivo                                                                        | Conteúdo                            |
| ------------------------------------------------------------------------------ | ----------------------------------- |
| [language-method.md](./language-method.md)                                     | Método, status e classes semânticas |
| [ubiquitous-language-register.md](./ubiquitous-language-register.md)           | Registro principal (48 termos)      |
| [synonyms-and-aliases.md](./synonyms-and-aliases.md)                           | Sinônimos e aliases                 |
| [homonyms-and-collisions.md](./homonyms-and-collisions.md)                     | Homônimos e normalizações críticas  |
| [ambiguous-terms-resolution.md](./ambiguous-terms-resolution.md)               | Status de resolução AT-001          |
| [business-verbs-catalog.md](./business-verbs-catalog.md)                       | Catálogo de verbos empresariais     |
| [business-nouns-catalog.md](./business-nouns-catalog.md)                       | Catálogo de substantivos            |
| [state-event-command-semantics.md](./state-event-command-semantics.md)         | Estado, evento, comando, timestamp  |
| [commercial-language.md](./commercial-language.md)                             | Vocabulário comercial               |
| [service-request-language.md](./service-request-language.md)                   | Solicitação                         |
| [service-order-language.md](./service-order-language.md)                       | OS                                  |
| [resource-language.md](./resource-language.md)                                 | Recursos e mão de obra              |
| [execution-and-evidence-language.md](./execution-and-evidence-language.md)     | Execução e evidências               |
| [measurement-and-billing-language.md](./measurement-and-billing-language.md)   | Medição e faturamento               |
| [document-language.md](./document-language.md)                                 | Documentos lógicos e versões        |
| [responsibility-and-aging-language.md](./responsibility-and-aging-language.md) | Responsabilidade, handoff, aging    |
| [technical-versus-domain-language.md](./technical-versus-domain-language.md)   | Domínio vs técnico                  |
| [naming-policy.md](./naming-policy.md)                                         | Política de nomes                   |
| [terms-pending-business-validation.md](./terms-pending-business-validation.md) | GLQ-001..012                        |
| [language-consistency-audit.md](./language-consistency-audit.md)               | Auditoria cruzada                   |
| [prompt-04-completeness-report.md](./prompt-04-completeness-report.md)         | Relatório de completude             |

## Cadeia

```text
SOURCE → EVIDENCE → TERM → BR / FR / NFR / UC → DDP → FUTURE TEST (TBD)
```

## Totais

| Status                     | Quantidade |
| -------------------------- | ---------- |
| ACCEPTED_FOR_DOCUMENTATION | 24         |
| AMBIGUOUS                  | 18         |
| PENDING_BUSINESS_DECISION  | 6          |
| CONFIRMED                  | 0          |

## Restrições

- Sem enums, bounded contexts, classes ou API congelados.
- Ambiguidades não resolvidas permanecem abertas com DDP.

## Histórico

Primeira execução usou `glossary-method.md`, `glossary-traceability.md` — histórico preservado no Git.
