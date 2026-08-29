# QA-FE-001

| Campo | Valor |
| --- | --- |
| Document ID | Estratégia testes frontend |
| Stack | React 19 + Vite 7 + Playwright |
| Prompt | 15 |

## Pirâmide UI

| Nível | Ferramenta | Escopo |
| --- | --- | --- |
| Component | Vitest + RTL | Form validation display |
| Integration | Vitest + MSW | **Não** substitui API AuthZ tests |
| E2E | Playwright | UC jornadas |

## TEST-CAND E2E

| TEST-CAND | UC | Fluxo |
| --- | --- | --- |
| 053 | UC-005 | Intake → conversão |
| 054 | UC-008,009 | Liberar → executar |
| 055 | UC-021,022 | Medição → faturar |
| 056 | UC-023 | Registrar nota |

## O que UI **não** testa sozinha

| Regra | Por quê |
| --- | --- |
| SoD backend | UI pode esconder botão |
| Custo omitido | API pode vazar |
| UNQ PG | Sem browser |

## E2E negativo limitado

Playwright: botão liberar disabled — smoke only; **L4** prova deny.

## A11y

axe-playwright candidato — backlog.

## CI

`test:e2e` — main branch; artefatos trace on fail.

## Dados

Fixtures login test realm — test-data-strategy.md.
