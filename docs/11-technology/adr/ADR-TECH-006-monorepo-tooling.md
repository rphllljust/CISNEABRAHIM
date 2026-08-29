# ADR-TECH-006 — Monorepo e tooling

| Campo | Valor |
| --- | --- |
| ID | ADR-TECH-006 |
| Status | **ACCEPTED** |
| Data | 2026-08-28 |

## Contexto

API + Web + packages por BC/shared-kernel. Tipos compartilhados. CI futura. 18 módulos candidatos.

## Decisão

Adotar **pnpm workspaces** como package manager e **Turborepo 2.x** como orquestrador de tarefas (build, lint, test).

## Drivers

ADR-002 modularity; scorecard 4.12.

## Alternativas

| Alternativa | Resultado |
| --- | --- |
| npm workspaces | Rejeitado |
| Nx | Rejeitado — complexidade early |
| pnpm sem Turbo | Alternativa aceitável — menor cache CI |
| Polirepo | Rejeitado |

## Benefícios

- Eficiência disco pnpm
- Cache Turborepo em CI
- `workspace:*` protocol

## Custos

- Config turbo.json
- Aprendizado monorepo

## Riscos

TECH-RISK-007.

## Consequências

- `pnpm-workspace.yaml`, `turbo.json` na implementação
- Packages `apps/*`, `packages/*`

## Reversibilidade

Média.

## Sinais para revisão

- Turbo overhead > benefício time pequeno
- Migração para Nx se >15 packages

## Documentos relacionados

- [monorepo-evaluation.md](../monorepo-evaluation.md)
- [modularity-strategy.md](../../10-architecture/modularity-strategy.md)
