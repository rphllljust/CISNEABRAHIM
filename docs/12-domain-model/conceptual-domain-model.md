# DM-CONCEPT-001

| Campo | Valor |
| --- | --- |
| Document ID | Modelo conceitual de domínio |
| Prompt | 11 |

## Diagrama conceitual (Mermaid — relações incertas marcadas)

```mermaid
flowchart TB
  subgraph intake["Intake"]
    SR[ServiceRequest AGG-001]
  end

  subgraph operational["Operacional"]
    SO[ServiceOrder AGG-002]
    RA[ResourceAllocation AGG-003]
    EX[ExecutionRecord AGG-004]
    EV[EvidenceLink AGG-005]
  end

  subgraph financial["Financeiro — ciclos separados"]
    ME[Measurement AGG-006]
    BP[BillingPreparation AGG-007]
    IN[InformedInvoice AGG-008]
    PA[PaymentRegistration AGG-009]
  end

  subgraph commercial["Comercial"]
    PO[PurchaseOrder AGG-010]
    CR[CommercialReference AGG-011]
    PT[Party AGG-012]
  end

  subgraph documental["Documental"]
    LD[LogicalDocument AGG-013]
  end

  subgraph support["Suporte"]
    NT[NotificationDelivery AGG-014]
  end

  SR -->|"1:1? convert"| SO
  SO -->|"1:N"| RA
  SO -->|"1:1? 1:N?"| EX
  EX -->|"0:N"| EV
  EV -.->|docRef| LD
  SO -->|"0:N?"| ME
  ME -->|"0:1?"| BP
  BP -->|"0:N?"| IN
  IN -->|"0:N?"| PA
  SO -.->|commercialRefId| CR
  SO -.->|poRefId?| PO
  SR -.->|partyId| PT
  SO -->|"notify"| NT
```

`?` = CARD-DDP pendente. Linhas tracejadas = referência por ID, não composição.

## Maciços rejeitados

| Maciço rejeitado | Motivo |
| --- | --- |
| OS + Medição + Faturamento | Ciclos SM separados; INV-007 |
| Solicitação + OS | EP-015; INV-001 |
| Documento + OS | BC-014 owner distinto |
| PO + OS inline | DDP-009 SoT |

## Contextos × aggregates

| BC-CAND | AGG-CAND principal |
| --- | --- |
| 005 | 001 |
| 006 | 002 |
| 007 | 003 |
| 008 | 004 |
| 009 | 005 |
| 010 | 006 |
| 011 | 007 |
| 012 | 008 |
| 013 | 009 |
| 014 | 013 |
| 004 | 010 |
| 003 | 011 |
| 002 | 012 |
| 015 | 014 |
| 016 | RM-CAND apenas |
| 017 | eventos append — não AGG mutável cliente |
| 018 | EXT-REC staging |

## Leitura

Modelo **lógico**. Persistência (Drizzle) em prompt posterior — **não** Prompt 12 nesta execução.
