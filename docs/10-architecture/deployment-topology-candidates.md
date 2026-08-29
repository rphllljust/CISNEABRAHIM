# ARCH-DEPLOY-001

| Campo          | Valor                                |
| -------------- | ------------------------------------ |
| Document ID    | Topologias de implantação candidatas |
| Prompt         | 09                                   |
| Cloud provider | **Não escolhido**                    |

## Candidatos avaliados

| ID       | Topologia                  | Descrição                             | Status                 |
| -------- | -------------------------- | ------------------------------------- | ---------------------- |
| TOPO-001 | Aplicação única            | Um processo: UI+API+domínio           | Candidato inicial      |
| TOPO-002 | Frontend/backend separados | SPA + API modular monolith            | Candidato forte        |
| TOPO-003 | API + workers              | Monolith + fila para notif/integração | Candidato futuro       |
| TOPO-004 | Multi-serviço              | Microservices                         | Rejeitado início       |
| TOPO-005 | Serverless puro            | —                                     | Rejeitado — transações |

## TOPO-002 (preferido candidato) — detalhe

```text
[Browser/Mobile] ──HTTPS──► [Presentation static/host]
                                    │
                                    ▼
                            [API - Modular Monolith]
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              [PostgreSQL]   [Object Storage]  [Workers?]
              candidato      documentos         async
```

## Componentes candidatos (não escolhidos)

| Componente       | Opções mencionadas      | Decisão                 |
| ---------------- | ----------------------- | ----------------------- |
| Banco relacional | PostgreSQL candidato    | PROPOSED — ARCH-DDP-001 |
| Object storage   | Para TERM-033 binários  | PROPOSED — ARCH-DDP-002 |
| Message broker   | Notificação, integração | PENDING                 |
| Cache            | —                       | Não prematuramente      |
| CDN              | Assets estáticos        | PENDING                 |

## PostgreSQL como candidato (não decisão)

Justificativa candidata: transações ACID (ARCH-DRV-003), ecossistema maduro, JSON se necessário — **sem** escolher ORM ou versão.

## Workers candidatos

| Uso                       | BC  | Trigger           |
| ------------------------- | --- | ----------------- |
| Envio notificação         | 015 | DE pós-liberação  |
| Sync referência comercial | 018 | Schedule / evento |
| Relatórios pesados        | 016 | Async query       |

## O que não fazer

- Escolher AWS/Azure/GCP
- Provisionar infra
- Docker compose definitivo

Ver [ADR-006](./adr/ADR-006-deployment-baseline.md).
