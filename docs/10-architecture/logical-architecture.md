# ARCH-LOG-001

| Campo            | Valor                               |
| ---------------- | ----------------------------------- |
| Document ID      | Arquitetura lógica                  |
| Estilo candidato | Modular monolith (ADR-001 PROPOSED) |
| Prompt           | 09                                  |

## Diagrama lógico (candidato)

```text
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION                              │
│         (UI web/mobile futura — não especificada)            │
└──────────────────────────┬──────────────────────────────────┘
                           │ DTO / commands / queries
┌──────────────────────────▼──────────────────────────────────┐
│                    APPLICATION                               │
│   Orquestração de casos de uso · authZ gate · transações     │
│   Módulos por BC-CAND (facades, handlers de aplicação)       │
└──────────────────────────┬──────────────────────────────────┘
                           │ domain services / aggregates
┌──────────────────────────▼──────────────────────────────────┐
│                      DOMAIN                                  │
│   Entidades · invariantes · CMD · eventos · SM candidatas      │
│   Sem dependência de infra ou framework                        │
└──────────────────────────┬──────────────────────────────────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│INFRASTRUCTURE│  │ INTEGRATION  │  │  (shared kernel  │
│ persistência │  │ BC-CAND-018  │  │   mínimo — ver   │
│ arquivos     │  │ ACL externa  │  │  modularity)     │
│ filas?       │  │ anti-corrup. │  └──────────────────┘
└──────────────┘  └──────────────┘
```

## Módulos de domínio (alinhados a BC-CAND)

| Módulo lógico         | BC-CAND | Responsabilidade                   |
| --------------------- | ------- | ---------------------------------- |
| Identity & Access     | 001     | Identidade ator; ponte auth futura |
| Party & Client        | 002     | Cliente/party                      |
| Commercial Reference  | 003     | Proposta, preço, referência        |
| Purchase Order        | 004     | PO e saldo                         |
| Service Request       | 005     | Solicitação                        |
| Service Order         | 006     | OS                                 |
| Resource Allocation   | 007     | Alocação                           |
| Field Execution       | 008     | Execução                           |
| Execution Evidence    | 009     | Evidências                         |
| Measurement           | 010     | Medição                            |
| Billing Preparation   | 011     | Faturamento                        |
| Invoice & Receivables | 012     | Nota                               |
| Payment               | 013     | Pagamento                          |
| Document Management   | 014     | Documentos                         |
| Notification          | 015     | Notificações                       |
| Reporting & Analytics | 016     | Consultas                          |
| Audit & History       | 017     | Trilhas                            |
| External Integration  | 018     | ACL/sync                           |

## Fluxo representativo (WF-001 simplificado)

```text
Presentation → Application(ServiceRequest) → Domain → Infrastructure
                      ↓ evento candidato
               Application(ServiceOrder) → Domain
```

## O que não existe nesta fase

Pastas de código, packages, APIs REST, GraphQL, gRPC — **não criados**.

## Relacionados

- [layer-responsibilities.md](./layer-responsibilities.md)
- [dependency-rules.md](./dependency-rules.md)
- [modularity-strategy.md](./modularity-strategy.md)
