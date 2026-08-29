# TECH-COMPAT-001

| Campo | Valor |
| --- | --- |
| Document ID | Matriz de compatibilidade |
| Atualizado | 2026-08-28 |
| Prompt | 10 |

## Stack core

| De \ Para | Node 24 | TS 5.x | Nest 11 | Vite 7 | PG 18 | Drizzle |
| --- | --- | --- | --- | --- | --- | --- |
| Node 24 | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| TypeScript 5.x | ✓ | — | ✓ | ✓ | — | ✓ |
| NestJS 11 | ✓ | ✓ | — | — | ✓ | ✓ |
| React 19 | ✓ | ✓ | — | ✓ | — | — |
| Vite 7 | ✓ | ✓ | — | ✓ | — | — |
| PostgreSQL 18 | ✓ | — | ✓ | — | — | ✓ |
| Drizzle | ✓ | ✓ | ✓ | — | ✓ | — |
| pnpm 9 | ✓ | ✓ | ✓ | ✓ | — | — |
| Turborepo 2 | ✓ | ✓ | ✓ | ✓ | — | — |
| Vitest 3 | ✓ | ✓ | — | ✓ | — | — |
| Playwright 1.5x | ✓ | — | — | — | — | — |

✓ = compatibilidade documentada/ecossistema; validar pin na implementação.

## NestJS + Fastify

| Adapter | Status |
| --- | --- |
| @nestjs/platform-fastify | Suportado oficialmente |

## Drizzle + NestJS

| Padrão | Status |
| --- | --- |
| DrizzleModule community / custom provider | Candidato — TECH-DDP-009 |

## React + Vite

| Feature | Status |
| --- | --- |
| React 19 | Suportado Vite 6+ |
| SWC plugin | Candidato build |

## OS desenvolvimento

| OS | Suporte |
| --- | --- |
| Windows 10/11 | ✓ (workspace atual) |
| Linux CI | ✓ candidato |
| macOS | ✓ |

## Incompatibilidades conhecidas

| Combinação | Problema |
| --- | --- |
| Node 20 | EOL — não usar |
| Prisma + multi-schema modular | Friction — motivo Drizzle |
| Next.js + monorepo packages | Possível; não selecionado |

## Arquitetura × stack

| ADR-001 modular monolith | Nest modules + pnpm packages | ✓ |
| ADR-003 data ownership | Drizzle schema per module | ✓ |
| ADR-004 ACID | PostgreSQL transactions | ✓ |
| TOPO-002 FE/BE | Vite + Nest API | ✓ |
