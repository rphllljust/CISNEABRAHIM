# ADR-TECH-004 — Banco de dados

| Campo | Valor |
| --- | --- |
| ID | ADR-TECH-004 |
| Status | **ACCEPTED** |
| Data | 2026-08-28 |
| Verificação | PostgreSQL 18.6 — 2026-08-13 ([postgresql.org](https://www.postgresql.org/)) |

## Contexto

ADR-003 single write owner; ADR-004 ACID local; transações CMD-003, CMD-019; constraints INV; relatórios BC-016.

## Decisão

Adotar **PostgreSQL 18.x** como SGBD relacional autoritativo.

## Drivers

ARCH-DRV-003, 004; ADR-006 candidato PG; scorecard 4.55.

## Alternativas

| Alternativa | Resultado |
| --- | --- |
| MySQL | Rejeitado |
| MongoDB | Rejeitado — transações |
| SQLite | Rejeitado — produção multi-user |

## Benefícios

- ACID, constraints, MVCC, JSONB
- Schemas por módulo
- Maturidade operacional

## Custos

- Operação DB dedicada
- Migrations disciplinadas

## Riscos

TECH-RISK-003, TECH-RISK-012.

## Consequências

- DATABASE_URL em ambiente
- Testcontainers PG em testes integração

## Reversibilidade

Baixa em produção.

## Sinais para revisão

- Restrição infra impede PG 18
- Escala read replica necessária

## Documentos relacionados

- [database-evaluation.md](../database-evaluation.md)
- [data-architecture-overview.md](../../10-architecture/data-architecture-overview.md)
