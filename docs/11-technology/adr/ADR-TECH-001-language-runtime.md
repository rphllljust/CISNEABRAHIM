# ADR-TECH-001 — Linguagem e runtime

| Campo               | Valor        |
| ------------------- | ------------ |
| ID                  | ADR-TECH-001 |
| Status              | **ACCEPTED** |
| Data                | 2026-08-28   |
| Verificação versões | 2026-08-28   |

## Contexto

Modular monolith com frontend React e backend API (ADR-006 TOPO-002). Equipe e experiência UNKNOWN. Necessidade de tipagem forte, ecossistema maduro e transações com PostgreSQL.

## Decisão

Adotar **TypeScript** como linguagem principal e **Node.js 24.x Active LTS** como runtime de servidor e toolchain frontend.

## Drivers

ARCH-DRV-022, ARCH-DRV-013; scorecard runtime 4.35.

## Alternativas consideradas

| Alternativa              | Resultado                        |
| ------------------------ | -------------------------------- |
| Go backend + TS frontend | Rejeitado — duas linguagens      |
| Deno                     | Rejeitado — ecossistema Nest/ORM |
| .NET                     | Rejeitado — sem evidência equipe |
| JavaScript sem TS        | Rejeitado — integridade tipos    |

## Benefícios

- Stack unificada FE/BE/monorepo
- Tipos compartilhados entre packages
- Node 24 LTS suporte até 2028-04-30

## Custos

- Build step TS
- Disciplina strict mode

## Riscos

TECH-RISK-001, TECH-RISK-002.

## Consequências

- `.node-version` ou `engines` no package.json futuro
- CI em Node 24; preview Node 26 opcional

## Reversibilidade

Baixa após código extenso — média nesta fase.

## Sinais para revisão

- Node 26 LTS estável (out/2026)
- Requisito performance CPU-bound sem I/O

## Documentos relacionados

- [runtime-evaluation.md](../runtime-evaluation.md)
- [version-policy.md](../version-policy.md)
- ADR-TECH-002, ADR-TECH-003
