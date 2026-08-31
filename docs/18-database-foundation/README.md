# Database foundation — Prompt 17

Fundação local do PostgreSQL e persistência técnica (Drizzle).

**Estado atual:** o schema de domínio já existe (migrations `0002`–`0037`, incluindo OS, medição, faturamento, outbox, alertas, workforce). Os documentos abaixo descrevem a fundação do Prompt 17 e **não foram reescritos**.

Fundação do Prompt 17: **sem tabelas empresariais** naquele momento.

| Documento                                                            | Conteúdo                         |
| -------------------------------------------------------------------- | -------------------------------- |
| [local-postgresql.md](local-postgresql.md)                           | Docker Compose, versão, volumes  |
| [connection-management.md](connection-management.md)                 | Pool e cliente `@cisne/database` |
| [environment-variables.md](environment-variables.md)                 | Variáveis e `.env.example`       |
| [migration-workflow.md](migration-workflow.md)                       | drizzle-kit generate/migrate     |
| [safe-reset-procedure.md](safe-reset-procedure.md)                   | Reset local seguro               |
| [backup-restore-development.md](backup-restore-development.md)       | Backup dev                       |
| [troubleshooting.md](troubleshooting.md)                             | Problemas comuns                 |
| [prompt-17-completeness-report.md](prompt-17-completeness-report.md) | Relatório Prompt 17              |

## ADRs aplicados

- **ADR-TECH-004** — PostgreSQL 18.x
- **ADR-TECH-005** — Drizzle ORM + drizzle-kit

## Escopo explícito

| Permitido                 | Bloqueado                             |
| ------------------------- | ------------------------------------- |
| Schema `infrastructure`   | Tabelas de domínio (cliente, OS, PO…) |
| `schema_baseline` técnica | Autenticação / usuários               |
| Health check com DB       | Seeds empresariais                    |
