# TECH-DA-001

| Campo | Valor |
| --- | --- |
| Document ID | Avaliação acesso a dados |
| Prompt | 10 |

## Opções comparadas

| Opção | Migrations | Constraints | Transações | Locking | Introspecção | Testabilidade | Abstração |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prisma | ✓✓ | ✓ | ✓ | Médio | ✓✓ | ✓✓ | Alta — risco |
| **Drizzle** | ✓✓ | ✓✓ | ✓✓ | ✓ | ✓ | ✓✓ | Média-baixa |
| TypeORM | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Alta — decorators |
| Kysely | Manual | ✓✓ | ✓✓ | ✓✓ | ✓ | ✓✓ | Baixa |
| Híbrido | ✓ | ✓✓ | ✓✓ | ✓✓ | ✓ | ✓✓ | Controlada |

## Seleção: Drizzle ORM + SQL explícito pontual

| Razão | Detalhe |
| --- | --- |
| Domínio rico | Schema ≠ domain model (EP-024) — Drizzle schema em infrastructure |
| SQL visível | Queries complexas e relatórios em SQL/Kysely opcional |
| Migrations | drizzle-kit versionado |
| Transações | `db.transaction()` explícito |
| Constraints | DDL reflete INV no banco |
| Testabilidade | In-memory PG ou testcontainers futuro |
| Lock-in | Menor que Prisma schema proprietário |

## Prisma — rejeitado como padrão

Produtivo; porém Prisma schema como fonte única conflita com ownership por módulo e migrations cross-schema. Client gerado acopla domain. Aceitável apenas se equipe priorizar velocidade extrema — score menor em integridade/lock-in.

## TypeORM — rejeitado

Decorators no domain risk; manutenção community; migrations menos previsíveis.

## Kysely puro — rejeitado como único

Excelente para reporting; verboso para CRUD módulos — usar **pontualmente** em BC-016.

## Híbrido controlado

- **Drizzle:** writes, migrations por módulo
- **SQL raw / Kysely:** relatórios pesados, queries ad-hoc auditadas

## Regras

1. Domain layer **sem** imports Drizzle/Prisma
2. Repositories em infrastructure implementam ports
3. Migrations por módulo/schema — ARCH-DDP-001 alinhado
