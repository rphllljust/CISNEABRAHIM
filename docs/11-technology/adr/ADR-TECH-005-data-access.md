# ADR-TECH-005 — Acesso a dados

| Campo | Valor |
| --- | --- |
| ID | ADR-TECH-005 |
| Status | **ACCEPTED** |
| Data | 2026-08-28 |

## Contexto

Domínio não pode depender de ORM (EP-024). Necessidade migrations, constraints, transações, locking. Ownership por módulo/schema.

## Decisão

Adotar **Drizzle ORM** para persistência primária (migrations via drizzle-kit), com **SQL explícito ou Kysely** permitido pontualmente para relatórios e queries complexas (BC-016).

**Não** adotar Prisma ou TypeORM como padrão.

## Drivers

ARCH-DRV-004; ADR-003; scorecard 4.18.

## Alternativas

| Alternativa | Resultado |
| --- | --- |
| Prisma | Rejeitado — abstração alta, schema central |
| TypeORM | Rejeitado — decorators, manutenção |
| Kysely only | Rejeitado — verboso CRUD |
| Raw pg only | Rejeitado — produtividade migrations |

## Benefícios

- SQL-like; schema em infrastructure
- Transações explícitas
- Menor lock-in que Prisma

## Custos

- Menos “batteries” que Prisma Studio
- Curva drizzle-kit

## Riscos

TECH-RISK-003, TECH-RISK-004, TECH-RISK-006.

## Consequências

- Repositories implementam ports com Drizzle
- Domain zero imports drizzle-orm

## Reversibilidade

Média — migração possível com esforço.

## Sinais para revisão

- Drizzle limita constraint necessária
- Equipe não produtiva após 2 sprints

## Documentos relacionados

- [data-access-evaluation.md](../data-access-evaluation.md)
- TECH-DDP-009
