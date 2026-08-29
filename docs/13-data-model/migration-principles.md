# DM-MIG-001

| Campo       | Valor                                      |
| ----------- | ------------------------------------------ |
| Document ID | Princípios de migration (futuro)           |
| Status      | NOT STARTED — sem DDL neste prompt         |
| Prompt      | 12                                         |
| Stack       | Drizzle + PostgreSQL 18 (ADR-TECH-004/005) |

## Princípios

| #   | Princípio                                                             |
| --- | --------------------------------------------------------------------- |
| 1   | Migrations incrementais e reversíveis quando possível                 |
| 2   | Um schema lógico por BC owner — criar schemas na ordem de dependência |
| 3   | Constraints nomeadas: `unq_`, `chk_`, `fk_` prefixos                  |
| 4   | Seed data separado de migration estrutural                            |
| 5   | CARD-DDP fechadas antes de UNQ que fixam cardinalidade                |
| 6   | Índices INDEX_HYPOTHESIS só após baseline + explain                   |
| 7   | Sem dados empresariais inventados em seeds                            |

## Ordem candidata de criação

```text
pty → com → po → sr → so → res → exe → doc → evd → msr → bill → inv → pay → ntf → int → aud
```

## O que não fazer na primeira migration

| Item                         | Motivo              |
| ---------------------------- | ------------------- |
| Todas UNQ pendentes CARD-DDP | Quebra evolução     |
| Particionamento              | Sem volume          |
| Materialized views BC-016    | Reporting posterior |
| RLS policies                 | Após auth BC-001    |

## Versionamento Drizzle

Repositório futuro: `packages/db/migrations/` — **não criado** neste prompt.

## Rollback

Down migration obrigatória para constraints destrutivas; dados de produção exigem playbook separado.

## Validação pós-migration

Checklist: FK integrity, enum alignment com SM-CAND, INV smoke tests.
