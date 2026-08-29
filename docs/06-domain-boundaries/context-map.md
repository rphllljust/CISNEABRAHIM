# DBND-CTX-MAP-001

| Campo | Valor |
| --- | --- |
| Document ID | Mapa de contextos candidatos |
| Prompt | 05 |

> Diagrama **candidato**. Setas indicam dependência de informação, não deploy.

```mermaid
flowchart TB
  subgraph commercial [SUBD-005 Comercial]
    BC02[BC-002 Party]
    BC03[BC-003 Commercial Ref]
    BC04[BC-004 PO]
  end

  subgraph intake [SUBD-001 Demanda]
    BC05[BC-005 Service Request]
  end

  subgraph operations [SUBD-002 Operação OS]
    BC06[BC-006 Service Order]
  end

  subgraph resources [SUBD-003 Recursos]
    BC07[BC-007 Resource Mgmt]
  end

  subgraph field [SUBD-004 Campo]
    BC08[BC-008 Execution]
    BC09[BC-009 Evidence]
  end

  subgraph financial [SUBD-006 Financeiro]
    BC10[BC-010 Measurement]
    BC11[BC-011 Billing Prep]
    BC12[BC-012 Invoice]
    BC13[BC-013 Payment]
  end

  subgraph support [Suporte]
    BC14[BC-014 Documents]
    BC15[BC-015 Notification]
    BC16[BC-016 Reporting]
    BC17[BC-017 Audit]
    BC01[BC-001 Identity]
    BC18[BC-018 Integration]
  end

  BC18 --> BC03
  BC18 --> BC04
  BC02 --> BC05
  BC05 -->|conversão| BC06
  BC03 --> BC06
  BC04 --> BC06
  BC06 --> BC07
  BC06 --> BC08
  BC08 --> BC09
  BC09 --> BC14
  BC08 --> BC10
  BC10 --> BC11
  BC11 --> BC12
  BC12 --> BC13
  BC06 -.-> BC17
  BC08 -.-> BC17
  BC01 -.-> BC06
  BC16 -.->|read| BC06
  BC15 -.->|events| BC06
```

Legenda: linha sólida = fluxo operacional candidato; tracejada = transversal (auditoria, leitura, auth).

Detalhamento de relações DDD: [context-relationships.md](./context-relationships.md).
