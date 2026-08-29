# ADR-TECH-007 — Ferramentas de teste

| Campo | Valor |
| --- | --- |
| ID | ADR-TECH-007 |
| Status | **ACCEPTED** |
| Data | 2026-08-28 |

## Contexto

EP-022 testes proporcionais ao risco. Stack Vite/TS/Nest. Fluxos financeiros e authZ críticos.

## Decisão

Adotar:

- **Vitest 3.x** — testes unitários e integração API
- **supertest** ou Nest testing utilities — HTTP integration
- **Testcontainers** (PostgreSQL) — candidato testes integração DB
- **Playwright 1.5x** — E2E browser

**Não** adotar Jest como padrão nem Cypress como E2E primário.

## Drivers

ARCH-DRV-019; QA-SC; scorecard 4.25.

## Alternativas

| Alternativa | Resultado |
| --- | --- |
| Jest + Cypress | Rejeitado — score menor |
| Jest + Playwright | Alternativa viável |
| Node test runner only | Rejeitado |

## Benefícios

- Vitest alinhado Vite
- Playwright traces CI
- Velocidade feedback

## Custos

- Playwright browsers download
- Testcontainers requer Docker

## Riscos

TECH-RISK-009.

## Consequências

- `turbo test` no pipeline
- Pirâmide: muitos unit, médio integração, poucos E2E

## Reversibilidade

Alta nesta fase.

## Sinais para revisão

- Flaky E2E > threshold
- Vitest incompatibilidade Nest edge case

## Documentos relacionados

- [testing-tools-evaluation.md](../testing-tools-evaluation.md)
