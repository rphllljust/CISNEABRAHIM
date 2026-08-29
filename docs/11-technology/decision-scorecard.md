# TECH-SCORE-001

| Campo | Valor |
| --- | --- |
| Document ID | Scorecard de decisão tecnológica |
| Pesos | Fixos — ver technology-selection-method.md |
| Prompt | 10 |

## Resultado agregado (ponderado / 5)

| Decisão | Vencedor | Score | 2º lugar | Gap |
| --- | --- | --- | --- | --- |
| Runtime | TypeScript + Node 24 LTS | 4.35 | Deno 3.10 | +1.25 |
| Backend | NestJS + Fastify | 4.28 | Fastify estruturado 3.85 | +0.43 |
| Frontend | React + Vite | 4.22 | Next.js 3.95 | +0.27 |
| Database | PostgreSQL 18 | 4.55 | — (único adequado) | — |
| Data access | Drizzle + SQL pontual | 4.18 | Prisma 3.92 | +0.26 |
| Monorepo | pnpm + Turborepo | 4.12 | pnpm simples 4.05 | +0.07 |
| Testes | Vitest + Playwright | 4.25 | Jest + Cypress 3.88 | +0.37 |

## Matriz detalhada — Runtime

| Critério | Peso | TS+Node24 | Go | Deno |
| --- | --- | --- | --- | --- |
| Integridade | 15% | 4 | 5 | 3 |
| Segurança | 12% | 4 | 5 | 4 |
| Testabilidade | 12% | 5 | 4 | 4 |
| Manutenção | 10% | 5 | 4 | 3 |
| Produtividade | 10% | 5 | 3 | 4 |
| Compat. arch | 10% | 5 | 3 | 3 |
| Operação | 8% | 5 | 5 | 3 |
| Documentação | 8% | 5 | 4 | 3 |
| Curva | 7% | 4 | 2 | 3 |
| Lock-in | 5% | 3 | 4 | 4 |
| Custo | 3% | 5 | 5 | 5 |
| **Ponderado** | | **4.35** | **3.95** | **3.10** |

Go: forte tecnicamente mas **duas linguagens** (FE React + BE Go) aumenta curva e reduz compatibilidade com stack unificada — não justificado sem equipe Go.

## Matriz — Backend

| Opção | Ponderado |
| --- | --- |
| NestJS (adapter Fastify) | 4.28 |
| Fastify + plugins estruturados | 3.85 |
| Express + manual | 3.45 |

NestJS: módulos nativos alinham BC-CAND; DI; guards para authZ futura; ecossistema maduro.

## Matriz — Frontend

| Opção | Ponderado | Nota SSR |
| --- | --- | --- |
| React + Vite | 4.22 | SSR não exigido (TECH-DDP-001) |
| React + Next.js | 3.95 | Overhead se SPA basta |
| Vue + Vite | 3.75 | Menor pool TS full-stack |

## Matriz — Data access

| Opção | Ponderado |
| --- | --- |
| Drizzle | 4.18 |
| Prisma | 3.92 |
| TypeORM | 3.35 |
| Kysely puro | 3.88 |
| Híbrido Drizzle+SQL | 4.18 (= seleção) |

Drizzle: SQL explícito, migrations, constraints, transações — menor risco ORM-anêmico que Prisma para domínio rico.

## Matriz — Monorepo

| Opção | Ponderado |
| --- | --- |
| pnpm + Turborepo | 4.12 |
| pnpm simples | 4.05 |
| npm workspaces | 3.70 |
| Nx | 3.95 |
| Polirepo | 3.20 |

Turborepo: cache CI sem complexidade Nx; pnpm: eficiência disco.

## Matriz — Testes

| Opção | Ponderado |
| --- | --- |
| Vitest + Playwright + supertest | 4.25 |
| Jest + Cypress | 3.88 |
| Jest + Playwright | 4.05 |

Vitest: alinhado Vite/TS; velocidade; ESM nativo.
