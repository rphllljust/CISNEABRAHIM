# TECH-QG-001 — Prompt 10 completeness report

| Campo | Valor |
| --- | --- |
| Prompt | 10 |
| Título | Seleção técnica da stack e ADRs de tecnologia |
| Gerado em | 2026-08-28 |
| Resultado | PASS_WITH_RESTRICTIONS |

## Pré-condições

| Item | Status |
| --- | --- |
| Prompt 09 commitado | `9ea9184` |
| Working tree limpo (início) | Sim |
| package.json criado | **Não** |
| Dependências instaladas | **Não** |
| Prompt 11 executado | **Não** |

## Stack selecionada

| Camada | Tecnologia | Versão / política |
| --- | --- | --- |
| Runtime | Node.js LTS | 24.x (verificado 2026-08-28) |
| Linguagem | TypeScript | 5.x strict |
| Backend | NestJS + Fastify adapter | 11.x (pin na impl.) |
| Frontend | React + Vite | 19.x + 7.x |
| Database | PostgreSQL | 18.x (18.6+ ref.) |
| Data access | Drizzle ORM + SQL pontual | 0.4x+ (pin na impl.) |
| Monorepo | pnpm + Turborepo | 9.x + 2.x |
| Unit/Integration | Vitest + supertest + Testcontainers | 3.x |
| E2E | Playwright | 1.5x |
| Quality | ESLint + Prettier + Husky + lint-staged | impl. futura |

## ADRs tecnológicos

| ID | Status |
| --- | --- |
| ADR-TECH-001 | ACCEPTED |
| ADR-TECH-002 | ACCEPTED |
| ADR-TECH-003 | ACCEPTED |
| ADR-TECH-004 | ACCEPTED |
| ADR-TECH-005 | ACCEPTED |
| ADR-TECH-006 | ACCEPTED |
| ADR-TECH-007 | ACCEPTED |

**Total ADR-TECH:** 7 — **ACCEPTED:** 7 — **PROPOSED:** 0

## Alternativas rejeitadas (resumo)

Go, Deno, .NET · Express, Hono · Next.js, Vue, Angular · MySQL, MongoDB · Prisma, TypeORM · npm workspaces, Nx, polirepo · Jest, Cypress

## Contagens

| Artefato | Qtd |
| --- | --- |
| Arquivos docs/11-technology/ | 24 |
| ADR-TECH | 7 |
| TECH-RISK | 12 |
| TECH-DDP | 9 |
| Critérios scorecard | 11 |

## Quality gate

| Critério | Resultado |
| --- | --- |
| Toda escolha possui ADR | PASS |
| Stack compatível com arquitetura 09 | PASS |
| PostgreSQL avaliado transacional | PASS |
| Nenhuma dependência instalada | PASS |
| Nenhum código / package.json | PASS |
| Scorecard com pesos pré-definidos | PASS |
| Versões com data verificação | PASS |
| Prompt 11 não executado | PASS |

**Quality gate:** PASS_WITH_RESTRICTIONS (equipe UNKNOWN; pins exatos na implementação; object storage/IdP pendentes)

## Riscos críticos

- TECH-RISK-011 experiência equipe
- TECH-RISK-003 migrations produção
- ED-004 parcialmente atualizado — stack documentada, implementação não iniciada

## Rastreabilidade

- requirements-traceability.md
- prompt-execution-log.md
- docs/README.md
- engineering-decisions-register.md

## Próximo passo

Prompt 11 — **não executado**.
