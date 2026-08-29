# Requirements traceability matrix

| Campo | Valor |
| --- | --- |
| Document ID | RTM-001 |
| Policy | [`../00-governance/traceability-policy.md`](../00-governance/traceability-policy.md) |
| Last updated | 2026-08-28 (Prompt 11) |
| Rule | Colunas inaplicáveis = `TBD`. Proibido inventar para completar. |

Cadeia:

```text
SOURCE → EVIDENCE → BUSINESS RULE → FUNCTIONAL REQUIREMENT → NON-FUNCTIONAL REQUIREMENT → QUALITY SCENARIO → USE CASE → DOMAIN MODEL → ARCHITECTURE DECISION → IMPLEMENTATION → TEST → ACCEPTANCE
```

## Matriz atual

| SOURCE | EVIDENCE | BUSINESS RULE | FR | UC | DOMAIN MODEL | ADR | IMPLEMENTATION | TEST | ACCEPTANCE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-000 | Texto do Prompt 00 (governança) | — (não operacional) | `TBD` | `TBD` | `TBD` | ED-001–ED-004 | Nenhuma | N/A | Quality gates Prompt 00 |
| SRC-000 | Menção a solicitações e OS | BR-001 `CANDIDATE` | FR-008, FR-009 | UC-005 | `TBD` | `TBD` | `TBD` | `TBD` | AC-010, AC-011, AC-012 |
| SRC-001 | EV-028 | BR-001 `CANDIDATE` | FR-008, FR-009 | UC-005 | `TBD` | `TBD` | `TBD` | `TBD` | AC-010, AC-011, AC-012 |
| SRC-000 / SRC-001 | EV-055, EV-056 | BR-002 `CANDIDATE` | FR-029, FR-034 | UC-017, UC-020 | `TBD` | `TBD` | `TBD` | `TBD` | AC-034, AC-040 |
| SRC-000 / SRC-001 | EV-002, EV-003 | BR-003 `CANDIDATE` | — (restrição de escopo) | — | `TBD` | `TBD` | `TBD` | `TBD` | — |
| SRC-001 | EV-027, EV-028 | BR-004 `CANDIDATE` | FR-001, FR-008 | UC-001 | `TBD` | `TBD` | `TBD` | `TBD` | AC-001, AC-002, AC-010 |
| SRC-001 | EV-031, EV-032 | BR-005 `PENDING_VALIDATION` | FR-002 | UC-001 | `TBD` | `TBD` | `TBD` | `TBD` | AC-003 |
| SRC-001 | EV-013, EV-036–EV-039 | BR-006 `CANDIDATE` | FR-009, FR-010, FR-014, FR-017 | UC-005, UC-006, UC-008, UC-010 | `TBD` | `TBD` | `TBD` | `TBD` | AC-011, AC-012, AC-013, AC-018, AC-019, AC-022 |
| SRC-001 | EV-042 | BR-007 `CANDIDATE` | FR-011 | UC-006 | `TBD` | `TBD` | `TBD` | `TBD` | AC-014, AC-015 |
| SRC-001 | EV-058, EV-059 | BR-008 `CANDIDATE` | FR-012, FR-029, FR-030, FR-033 | UC-017, UC-019 | `TBD` | `TBD` | `TBD` | `TBD` | AC-016, AC-034, AC-035, AC-039 |
| SRC-001 | EV-062, EV-063 | BR-009 `CANDIDATE` | FR-034, FR-035, FR-036, FR-037 | UC-020, UC-021, UC-022 | `TBD` | `TBD` | `TBD` | `TBD` | AC-040, AC-041, AC-042, AC-043 |
| SRC-001 | EV-064, EV-065 | BR-010 `CANDIDATE` | FR-027, FR-039 | UC-016, UC-023 | `TBD` | `TBD` | `TBD` | `TBD` | AC-032, AC-045 |
| SRC-001 | EV-049–EV-051 | BR-011 `CANDIDATE` | FR-013, FR-024, FR-025 | UC-007, UC-015 | `TBD` | `TBD` | `TBD` | `TBD` | AC-017, AC-029, AC-030 |
| SRC-001 | EV-054, EV-055 | BR-012 `CANDIDATE` | FR-013, FR-023, FR-026 | UC-007, UC-015 | `TBD` | `TBD` | `TBD` | `TBD` | AC-017, AC-028, AC-031 |
| SRC-001 | EV-057, EV-058 | BR-013 `CANDIDATE` | FR-031 | UC-018 | `TBD` | `TBD` | `TBD` | `TBD` | AC-036 |
| SRC-001 | EV-074 | BR-014 `CANDIDATE` | FR-038 | UC-023 | `TBD` | `TBD` | `TBD` | `TBD` | AC-044 |
| SRC-001 | EV-081 | BR-015 `CANDIDATE` | FR-039 | UC-023 | `TBD` | `TBD` | `TBD` | `TBD` | AC-045 |
| SRC-001 | EV-082 | BR-016 `CANDIDATE` | FR-041, FR-042 | UC-025 | `TBD` | `TBD` | `TBD` | `TBD` | AC-047, AC-048, AC-049, AC-050 |
| SRC-001 | EV-053 | BR-017 `CANDIDATE` | FR-025, FR-028 | UC-015 | `TBD` | `TBD` | `TBD` | `TBD` | AC-030, AC-033 |
| SRC-001 | EV-061 | BR-018 `CANDIDATE` | FR-031, FR-032 | UC-018 | `TBD` | `TBD` | `TBD` | `TBD` | AC-036, AC-037, AC-038 |
| SRC-001 | EV-078 | BR-019 `CANDIDATE` | FR-015, FR-016 | UC-009 | `TBD` | `TBD` | `TBD` | `TBD` | AC-020, AC-021 |
| SRC-001 | EV-080, EV-082 | BR-020 `CANDIDATE` | FR-042 | UC-025 | `TBD` | `TBD` | `TBD` | `TBD` | AC-049, AC-050 |
| SRC-001 | EV-084 | BR-021 `PENDING_VALIDATION` | FR-015, FR-016 | UC-009 | `TBD` | `TBD` | `TBD` | `TBD` | AC-020, AC-021 |
| SRC-001 | EV-075, EV-076 | BR-022 `CANDIDATE` | RPT-REQ-001..012 (transversal) | UC-026 | `TBD` | `TBD` | `TBD` | `TBD` | — |
| SRC-001 | EV-078 | BR-023 `CANDIDATE` | FR-022, FR-032 | UC-014 | `TBD` | `TBD` | `TBD` | `TBD` | AC-027, AC-037, AC-038, AC-051 |
| SRC-001 | EV-012–EV-026 | BR-024 `CANDIDATE` | FR-001, FR-003–FR-007, FR-018–FR-021, FR-040 | UC-001–UC-004, UC-010–UC-013, UC-024 | `TBD` | `TBD` | `TBD` | `TBD` | AC-001–AC-009, AC-023–AC-026, AC-046, AC-052 |
| SRC-001 | EV-041 | BR-025 `CANDIDATE` | FR-010 | UC-006 | `TBD` | `TBD` | `TBD` | `TBD` | AC-013 |

Registro completo de evidências: [`../02-source-analysis/atomic-evidence-register.md`](../02-source-analysis/atomic-evidence-register.md) (84 entradas).

Fontes primárias (`NOT_PROVIDED`): sem linhas adicionais.

## Resumo Prompt 02

| Métrica | Valor |
| --- | --- |
| Requisitos funcionais (FR) | 42 (FR-001..FR-042) |
| Casos de uso (UC) | 26 (UC-001..UC-026) |
| Critérios de aceite (AC) | 52 (AC-001..AC-052) |
| Regras CONFIRMED | **0** |
| BR com FR vinculado | 24 de 25 (BR-003 = restrição de escopo sem FR dedicado) |
| Status dominante dos FRs | `PENDING_SOURCE_VALIDATION` (27), `PENDING_BUSINESS_DECISION` (15) |
| Artefatos adicionais | VR-022, AUTH-REQ-020, DR-028, DOC-REQ-014, NOTIF-REQ-010, INT-REQ-008, RPT-REQ-012, EX-018, RQ-QUESTION-025 |
| Índice completo | [`../03-requirements/README.md`](../03-requirements/README.md) |
| Relatório de completude | [`../03-requirements/prompt-02-completeness-report.md`](../03-requirements/prompt-02-completeness-report.md) |

Implementação, modelo de domínio, ADR operacionais e testes: **não iniciados** (Prompt 04+).

## Resumo Prompt 03

| Métrica | Valor |
| --- | --- |
| Requisitos não funcionais (NFR) | 40 (NFR-001..NFR-040) |
| Cenários de qualidade (QA-SC) | 28 (QA-SC-001..QA-SC-028) |
| Requisitos de segurança (SEC-REQ) | 24 |
| Questões abertas NFR (NFNQ) | 18 |
| NFR CONFIRMED | **0** |
| NFR com target numérico | **0** |
| RPO / RTO | TARGET_NOT_DEFINED (DDP-016) |
| Índice completo | [`../04-quality-attributes/README.md`](../04-quality-attributes/README.md) |
| Relatório de completude | [`../04-quality-attributes/prompt-03-completeness-report.md`](../04-quality-attributes/prompt-03-completeness-report.md) |

### Amostra NFR na matriz

| SOURCE | EVIDENCE | FR | NFR | QA-SC | RISK | DDP |
| --- | --- | --- | --- | --- | --- | --- |
| SRC-001 | EV-079 | FR-022 | NFR-001, NFR-006 | QA-SC-001 | RISK-003 | DDP-037 |
| SRC-001 | EV-028 | FR-009 | NFR-003 | QA-SC-003 | RISK-004 | DDP-002 |
| SRC-001 | EV-061 | FR-032 | NFR-008 | QA-SC-008 | RISK-020 | DDP-030 |
| SRC-001 | EV-083 | — | NFR-025..028 | QA-SC-021 | RISK-011 | DDP-016 |
| SRC-001 | EV-077 | FR-030 | NFR-012 | QA-SC-012 | RISK-010 | DDP-014 |

Matriz completa: [`../04-quality-attributes/nfr-risk-traceability.md`](../04-quality-attributes/nfr-risk-traceability.md).

## Resumo Prompt 04

| Métrica | Valor |
| --- | --- |
| Termos de glossário (TERM) | 48 (TERM-001..TERM-048) |
| CONFIRMED | **0** |
| ACCEPTED_FOR_DOCUMENTATION | 24 |
| AMBIGUOUS | 18 |
| PENDING_BUSINESS_DECISION | 6 |
| Questões abertas glossário (GLQ) | 12 |
| Índice | [`../05-ubiquitous-language/README.md`](../05-ubiquitous-language/README.md) |
| Relatório | [`../05-ubiquitous-language/prompt-04-completeness-report.md`](../05-ubiquitous-language/prompt-04-completeness-report.md) |
| Auditoria | [`../05-ubiquitous-language/language-consistency-audit.md`](../05-ubiquitous-language/language-consistency-audit.md) |

Cadeia estendida: `SOURCE → EVIDENCE → TERM → BR → FR → NFR → UC → DDP → FUTURE TEST (TBD)`.

## Resumo Prompt 05

| Métrica | Valor |
| --- | --- |
| Subdomínios (SUBD) | 12 (SUBD-001..SUBD-012) |
| Bounded contexts candidatos (BC-CAND) | 18 (BC-CAND-001..018) |
| CORE_CANDIDATE (subdomínio) | 4 |
| Capacidades mapeadas | 27/27 |
| Decisões fronteira (DBND) | 12 |
| Microserviços / implementação | **0** |
| Índice | [`../06-domain-boundaries/README.md`](../06-domain-boundaries/README.md) |
| Relatório | [`../06-domain-boundaries/prompt-05-completeness-report.md`](../06-domain-boundaries/prompt-05-completeness-report.md) |

Cadeia Prompt 05:

```text
CAPABILITY → SUBDOMAIN → BOUNDED CONTEXT CANDIDATE
BR / FR / UC → CONTEXT OWNER
DATA → AUTHORITATIVE CONTEXT
COMMAND / EVENT → CONTEXT OWNER
```

Matriz CAP→BC: [`../06-domain-boundaries/capability-to-context-matrix.md`](../06-domain-boundaries/capability-to-context-matrix.md).

## Resumo Prompt 06

| Métrica | Valor |
| --- | --- |
| Invariantes (INV) | 22 (INV-001..INV-022) |
| Comandos (CMD) | 22 (CMD-001..CMD-022) |
| Eventos domínio (DE) | 20 (DE-001..DE-020) |
| Rejeições (REJ) | 18 |
| Predicados (PRED) | 12 |
| INV CONFIRMED | **0** |
| Aggregates / estados definitivos | **0** |
| Índice | [`../07-domain-behavior/README.md`](../07-domain-behavior/README.md) |
| Relatório | [`../07-domain-behavior/prompt-06-completeness-report.md`](../07-domain-behavior/prompt-06-completeness-report.md) |

Cadeia Prompt 06:

```text
EV → BR → FR/UC → INV → CMD → DE / REJ
```

## Resumo Prompt 07

| Métrica | Valor |
| --- | --- |
| Máquinas candidatas (SM-CAND) | 10 |
| Estados candidatos (STATE-CAND) | 52 |
| Transições candidatas (TR-CAND) | 48 |
| Guardas (GUARD) | 28 |
| Transições inválidas (INV-TR) | 22 |
| Dependências cruzadas (XLC) | 14 |
| SM definitivas | **0** |
| Código / enum / script | **0** |
| Índice | [`../08-state-machines/README.md`](../08-state-machines/README.md) |
| Relatório | [`../08-state-machines/prompt-07-completeness-report.md`](../08-state-machines/prompt-07-completeness-report.md) |

Cadeia Prompt 07:

```text
INV → CMD → DE → SM-CAND → STATE-CAND → TR-CAND → GUARD
```

## Resumo Prompt 08

| Métrica | Valor |
| --- | --- |
| Atores (ACT) | 12 |
| Papéis candidatos (ROLE-CAND) | 16 |
| Regras autorização (AUTHZ) | 42 |
| Segregação (SOD) | 12 |
| Ações sensíveis | 28 |
| Decisões pendentes (ADP) | 14 |
| Roles técnicas / código | **0** |
| Índice | [`../09-authorization/README.md`](../09-authorization/README.md) |
| Relatório | [`../09-authorization/prompt-08-completeness-report.md`](../09-authorization/prompt-08-completeness-report.md) |

Cadeia Prompt 08:

```text
ACT → ROLE-CAND → AUTHZ → CMD/TR → SOD → DENY → SEC-REQ
```

## Resumo Prompt 09

| Métrica | Valor |
| --- | --- |
| Drivers arquiteturais (ARCH-DRV) | 22 |
| ADRs | 6 (2 ACCEPTED, 4 PROPOSED) |
| Riscos arquiteturais (ARCH-RISK) | 14 |
| Decisões pendentes (ARCH-DDP) | 12 |
| Estilo candidato | Modular monolith |
| Framework / código | **0** |
| Índice | [`../10-architecture/README.md`](../10-architecture/README.md) |
| Relatório | [`../10-architecture/prompt-09-completeness-report.md`](../10-architecture/prompt-09-completeness-report.md) |

Cadeia Prompt 09:

```text
NFR/SEC/RISK → ARCH-DRV → OPTIONS → ADR → LOGICAL ARCH → BC MODULES
```

## Resumo Prompt 10

| Métrica | Valor |
| --- | --- |
| ADR-TECH | 7 (todos ACCEPTED) |
| Drivers scorecard | 11 critérios |
| TECH-RISK | 12 |
| TECH-DDP | 9 |
| package.json / deps instaladas | **0** |
| Índice | [`../11-technology/README.md`](../11-technology/README.md) |
| Relatório | [`../11-technology/prompt-10-completeness-report.md`](../11-technology/prompt-10-completeness-report.md) |

Stack documentada:

```text
Node 24 LTS · TypeScript 5 · NestJS 11 · React 19 · Vite 7 · PostgreSQL 18 · Drizzle · pnpm · Turborepo · Vitest · Playwright
```

Cadeia Prompt 10:

```text
ARCH-DRV → SCORECARD → ADR-TECH → COMPATIBILITY / VERSION-POLICY
```

## Resumo Prompt 11

| Métrica | Valor |
| --- | --- |
| Aggregates candidatos (AGG-CAND) | 14 |
| ACCEPTED_FOR_LOGICAL_MODELING | 4 |
| Entidades (ENTITY-CAND) | 26 |
| Value objects (VO-CAND) | 22 |
| Cardinalidades pendentes (CARD-DDP) | 12 |
| Invariantes mapeadas | 22/22 |
| ORM / tabelas / código | **0** |
| Índice | [`../12-domain-model/README.md`](../12-domain-model/README.md) |
| Relatório | [`../12-domain-model/prompt-11-completeness-report.md`](../12-domain-model/prompt-11-completeness-report.md) |

Cadeia Prompt 11:

```text
TERM → ENTITY/VO → AGG-CAND → INV → CMD → SM-CAND
```

## Resumo Prompt 12

| Métrica | Valor |
| --- | --- |
| Tabelas candidatas (TBL-CAND) | 25 |
| Unicidade candidata (UNQ-CAND) | 16 |
| Check constraints (CHK-CAND) | 14 |
| FK candidatas | 32 |
| INDEX_HYPOTHESIS | 18 |
| Cardinalidades pendentes (CARD-DDP) | 12 (herdadas) |
| Riscos (DATA-RISK) | 12 |
| DDL / migrations / banco | **0** |
| Índice | [`../13-data-model/README.md`](../13-data-model/README.md) |
| Relatório | [`../13-data-model/prompt-12-completeness-report.md`](../13-data-model/prompt-12-completeness-report.md) |

Cadeia Prompt 12:

```text
AGG-CAND → TBL-CAND → UNQ/CHK/FK → INV → INDEX_HYPOTHESIS
```

## Resumo Prompt 13

| Métrica | Valor |
| --- | --- |
| Comandos críticos analisados | 11 |
| Decisões transacionais (TXN-DEC) | 14 |
| Cenários falha (TXN-FAIL) | 24 |
| Cenários teste (TXN-TEST) | 18 |
| Operações FINANCIAL_RACE | 6 |
| Outbox | PROPOSED (não ACCEPTED) |
| Código / migrations / filas | **0** |
| Índice | [`../14-transaction-design/README.md`](../14-transaction-design/README.md) |
| Relatório | [`../14-transaction-design/prompt-13-completeness-report.md`](../14-transaction-design/prompt-13-completeness-report.md) |

Cadeia Prompt 13:

```text
CMD → boundary → isolation/lock → idempotency → external effect → reconcile
```

## Resumo Prompt 14

| Métrica | Valor |
| --- | --- |
| Ativos (SEC-AST) | 18 |
| Ameaças STRIDE (SEC-THR) | 36 |
| Casos de abuso (SEC-ABU) | 16 |
| Decisões (SEC-DEC) | 16 |
| Riscos residuais (SEC-RISK) | 14 |
| Cenários teste (SEC-TEST) | 22 |
| Fluxos modelados | 8 |
| Código | **0** |
| Índice | [`../15-security/README.md`](../15-security/README.md) |
| Relatório | [`../15-security/prompt-14-completeness-report.md`](../15-security/prompt-14-completeness-report.md) |

Cadeia Prompt 14:

```text
SEC-AST → boundary → STRIDE → SEC-CTL → SEC-TEST → SEC-RISK residual
```
