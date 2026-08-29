# Requirements traceability matrix

| Campo | Valor |
| --- | --- |
| Document ID | RTM-001 |
| Policy | [`../00-governance/traceability-policy.md`](../00-governance/traceability-policy.md) |
| Last updated | 2026-08-28 (Prompt 02) |
| Rule | Colunas inaplicáveis = `TBD`. Proibido inventar para completar. |

Cadeia:

```text
SOURCE → EVIDENCE → BUSINESS RULE → FUNCTIONAL REQUIREMENT → USE CASE → DOMAIN MODEL → ARCHITECTURE DECISION → IMPLEMENTATION → TEST → ACCEPTANCE
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

Implementação, modelo de domínio, ADR operacionais e testes: **não iniciados** (Prompt 03+).
