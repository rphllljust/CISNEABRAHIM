# ADR-TECH-002 — Framework backend

| Campo  | Valor        |
| ------ | ------------ |
| ID     | ADR-TECH-002 |
| Status | **ACCEPTED** |
| Data   | 2026-08-28   |

## Contexto

18 BC-CAND requerem modularidade, camadas APPLICATION/DOMAIN, guards para authZ futura, DI para testes. Fastify puro exige convenções manuais.

## Decisão

Adotar **NestJS 11.x** com adapter **Fastify** (`@nestjs/platform-fastify`) como framework backend da API modular monolith.

## Drivers

ARCH-DRV-005, 020; ADR-001, ADR-002; scorecard 4.28.

## Alternativas

| Alternativa                | Resultado                           |
| -------------------------- | ----------------------------------- |
| Fastify estruturado manual | Rejeitado — menos convenção modular |
| Express                    | Rejeitado                           |
| Hono/Elysia                | Rejeitado — maturidade              |

## Benefícios

- `@Module()` por BC
- Guards/pipes/interceptors para cross-cutting
- Testing module Nest
- Ecossistema documentado

## Custos

- Curva Nest (decorators, DI)
- Bundle/opinião do framework

## Riscos

TECH-RISK-005, TECH-RISK-011.

## Consequências

- `apps/api` no monorepo
- Domain permanece livre de decorators Nest

## Reversibilidade

Média — possível mas custoso migrar módulos.

## Sinais para revisão

- Over-engineering comprovado
- Performance Fastify adapter insuficiente vs puro

## Documentos relacionados

- [backend-evaluation.md](../backend-evaluation.md)
- [logical-architecture.md](../../10-architecture/logical-architecture.md)
