# DM-ERD-001

| Campo       | Valor                                                    |
| ----------- | -------------------------------------------------------- |
| Document ID | ERD lógico candidato                                     |
| Prompt      | 12                                                       |
| Nota        | Relações com `?` = cardinalidade **pendente** (CARD-DDP) |

## Diagrama

```mermaid
erDiagram
    PARTY ||--o{ SERVICE_REQUEST : "solicita?"
    PARTY ||--o{ COMMERCIAL_REFERENCE : possui
    SERVICE_REQUEST ||--o| SERVICE_ORDER : "converte CARD-DDP-008"
    COMMERCIAL_REFERENCE ||--o{ SERVICE_ORDER : "precifica CARD-DDP-009"
    PURCHASE_ORDER ||--o{ SERVICE_ORDER : vincula
    PURCHASE_ORDER ||--|{ PURCHASE_ORDER_LINE : contem
    PURCHASE_ORDER ||--o{ CONSUMPTION_ENTRY : "consome CARD-DDP-002"
    SERVICE_ORDER ||--|{ PLANNED_ITEM : contem
    SERVICE_ORDER ||--o{ RESPONSIBILITY_ASSIGNMENT : atribui
    SERVICE_ORDER ||--o{ RESOURCE_ALLOCATION : aloca
    SERVICE_ORDER ||--o{ EXECUTION_RECORD : "executa CARD-DDP-003"
    EXECUTION_RECORD ||--|{ PROGRESS_ENTRY : registra
    EXECUTION_RECORD ||--o{ EVIDENCE_LINK : evidencia
    LOGICAL_DOCUMENT ||--|{ DOCUMENT_VERSION : versiona
    LOGICAL_DOCUMENT ||--o{ EVIDENCE_LINK : "CARD-DDP-012"
    SERVICE_ORDER ||--o{ MEASUREMENT : "mede CARD-DDP-004"
    EXECUTION_RECORD ||--o{ MEASUREMENT : referencia
    MEASUREMENT ||--|{ MEASUREMENT_LINE : detalha
    PLANNED_ITEM ||--o{ MEASUREMENT_LINE : origem
    MEASUREMENT ||--o| BILLING_PREPARATION : "prep CARD-DDP-005"
    BILLING_PREPARATION ||--|{ BILLABLE_ITEM : gera
    BILLING_PREPARATION ||--o{ INFORMED_INVOICE : "nota CARD-DDP-006"
    INFORMED_INVOICE ||--o{ PAYMENT_REGISTRATION : "paga CARD-DDP-007"
    SERVICE_ORDER ||--o{ NOTIFICATION_DELIVERY : notifica
    DOMAIN_HISTORY_ENTRY }o--|| SERVICE_ORDER : "ref polimorfica"
    EXTERNAL_ID_MAPPING }o--|| COMMERCIAL_REFERENCE : mapeia
```

## Legenda cardinalidade Mermaid

| Símbolo     | Significado                   |
| ----------- | ----------------------------- |
| `\|\|--o{`  | 1:N confirmado candidato      |
| `\|\|--o\|` | 1:0..1 candidato com CARD-DDP |
| `\|\|--\|{` | 1:N composição filho          |
| `}o--\|\|`  | N:1 referência fraca          |

## Agregados e limites

| AGG          | Tabelas no boundary                          |
| ------------ | -------------------------------------------- |
| AGG-CAND-001 | service_request                              |
| AGG-CAND-002 | service_order, planned_item, responsibility? |
| AGG-CAND-003 | resource_allocation                          |
| AGG-CAND-004 | execution_record, progress_entry             |
| AGG-CAND-005 | evidence_link                                |
| AGG-CAND-006 | measurement, measurement_line                |
| AGG-CAND-007 | billing_preparation, billable_item           |
| AGG-CAND-008 | informed_invoice                             |
| AGG-CAND-009 | payment_registration                         |
| AGG-CAND-010 | purchase_order, lines, consumption           |
| AGG-CAND-011 | commercial_reference                         |
| AGG-CAND-012 | party                                        |
| AGG-CAND-013 | logical_document, document_version           |
| AGG-CAND-014 | notification_delivery                        |

## Fora do diagrama

- `integration_staging` — entrada técnica BC-018
- Autenticação BC-001
- Reporting BC-016 (read-only)

## Não afirmar

Este ERD **não** confirma cardinalidades listadas em CARD-DDP-001..012.
