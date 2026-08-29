# TECH-DB-001

| Campo | Valor |
| --- | --- |
| Document ID | Avaliação banco de dados |
| Prompt | 10 |

## Opção selecionada

**PostgreSQL 18** — autoridade transacional candidata (ADR-006, ADR-TECH-004 ACCEPTED).

Fonte: [postgresql.org](https://www.postgresql.org/) — 18.6 released 2026-08-13 (verificado 2026-08-28).

## Adequação aos requisitos

| Requisito | PostgreSQL |
| --- | --- |
| Transações ACID | ✓ nativo |
| Constraints avançadas | ✓ FK, CHECK, EXCLUDE |
| Concorrência | ✓ MVCC, `SELECT FOR UPDATE`, advisory locks |
| Locking otimista | ✓ xmin / version column pattern |
| Documentos JSON | ✓ JSONB para metadados; binário em object storage |
| Relatórios | ✓ SQL; BC-016 read models |
| Idempotência | ✓ unique constraints |
| Audit append-only | ✓ tabelas particionadas candidatas |
| Módulos/schema | ✓ schemas por BC candidato |

## Alternativas avaliadas e rejeitadas

| DB | Motivo rejeição |
| --- | --- |
| MySQL/MariaDB | Menor expressividade constraints; não driver arch |
| SQL Server | Licenciamento/custo; sem equipe |
| MongoDB | Fraco para transações financeiras cross-aggregate |
| SQLite | Não adequado multi-usuário produção |

## Versão

- **Produção candidata:** PostgreSQL **18.x** (suporte ativo)
- **Mínimo aceitável:** 16+ (se restrição infra) — preferir 18
- **Evitar:** 14 (EOL nov/2026)

## Riscos

TECH-RISK-003 (migrations), TECH-RISK-004 (performance relatórios).

## Object storage

Binários TERM-033 — **não** PostgreSQL BYTEA em escala — TECH-DDP-004.
