# TECH-INDEX-001

| Campo | Valor |
| --- | --- |
| Document ID | Seleção tecnológica — índice |
| Fase | FOUNDATION → stack definida documentalmente |
| Código / package.json | **NOT STARTED** |
| Verificação de versões | 2026-08-28 |
| Prompt | 10 |

> Stack **selecionada e justificada** em ADRs. Nenhuma dependência instalada nesta etapa.

## Stack recomendada (resumo)

| Camada | Seleção | ADR |
| --- | --- | --- |
| Linguagem / runtime | **TypeScript** + **Node.js 24 LTS** | ADR-TECH-001 |
| Backend | **NestJS** (HTTP adapter Fastify) | ADR-TECH-002 |
| Frontend | **React 19** + **Vite 7** | ADR-TECH-003 |
| Banco | **PostgreSQL 18** | ADR-TECH-004 |
| Acesso a dados | **Drizzle ORM** + SQL explícito pontual | ADR-TECH-005 |
| Monorepo | **pnpm workspaces** + **Turborepo** | ADR-TECH-006 |
| Testes | **Vitest** + **Playwright** + integração API | ADR-TECH-007 |

## Arquivos (17 + 7 ADRs)

| Arquivo | Conteúdo |
| --- | --- |
| [technology-selection-method.md](./technology-selection-method.md) | Método |
| [decision-scorecard.md](./decision-scorecard.md) | Pesos e scores |
| [runtime-evaluation.md](./runtime-evaluation.md) | Node/TS |
| [backend-evaluation.md](./backend-evaluation.md) | Nest/Fastify |
| [frontend-evaluation.md](./frontend-evaluation.md) | React/Next/Vite |
| [database-evaluation.md](./database-evaluation.md) | PostgreSQL |
| [data-access-evaluation.md](./data-access-evaluation.md) | ORM compare |
| [monorepo-evaluation.md](./monorepo-evaluation.md) | pnpm/Nx/Turbo |
| [testing-tools-evaluation.md](./testing-tools-evaluation.md) | Vitest/Jest/Playwright |
| [quality-tooling-evaluation.md](./quality-tooling-evaluation.md) | ESLint/Prettier/CI |
| [local-development-evaluation.md](./local-development-evaluation.md) | Dev local |
| [technology-risk-register.md](./technology-risk-register.md) | TECH-RISK |
| [version-policy.md](./version-policy.md) | Versões e atualização |
| [compatibility-matrix.md](./compatibility-matrix.md) | Compatibilidade |
| [technology-decisions-pending.md](./technology-decisions-pending.md) | TECH-DDP |
| [adr/](./adr/) | ADR-TECH-001..007 |
| [prompt-10-completeness-report.md](./prompt-10-completeness-report.md) | Relatório |

## Compatibilidade arquitetural

| ADR arquitetura (09) | Stack (10) |
| --- | --- |
| Modular monolith (ADR-001) | NestJS modules por BC |
| BC boundaries (ADR-002) | pnpm packages por módulo |
| Data ownership (ADR-003) | Schema Drizzle por módulo |
| ACID local (ADR-004) | PostgreSQL transações |
| ACL integração (ADR-005) | Módulo integration Nest |
| TOPO-002 FE/BE (ADR-006) | Vite SPA + API Nest |

## Pendências

Object storage, broker, IdP, PWA — ver [technology-decisions-pending.md](./technology-decisions-pending.md).
