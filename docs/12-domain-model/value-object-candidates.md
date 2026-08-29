# DM-VO-001

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | Value objects candidatos |
| Total       | 22 (VO-CAND-001..022)    |
| Prompt      | 11                       |

| ID          | Nome                    | Uso                     | Imutável | Status                    |
| ----------- | ----------------------- | ----------------------- | -------- | ------------------------- |
| VO-CAND-001 | ServiceRequestId        | REF                     | ✓        | CANDIDATE                 |
| VO-CAND-002 | ServiceOrderId          | REF                     | ✓        | CANDIDATE                 |
| VO-CAND-003 | PartyId                 | REF                     | ✓        | CANDIDATE                 |
| VO-CAND-004 | DocumentId              | REF                     | ✓        | CANDIDATE                 |
| VO-CAND-005 | VersionNumber           | Versão doc              | ✓        | CANDIDATE                 |
| VO-CAND-006 | MoneyAmount             | Preço/custo             | ✓        | CANDIDATE                 |
| VO-CAND-007 | CurrencyCode            | ISO 4217 candidato      | ✓        | PENDING_BUSINESS_DECISION |
| VO-CAND-008 | QuantityWithUnit        | Qty + unidade           | ✓        | CANDIDATE                 |
| VO-CAND-009 | UnitOfMeasure           | hora, m³, diária…       | ✓        | PENDING_SOURCE_VALIDATION |
| VO-CAND-010 | PlannedQuantity         | Item planejado          | ✓        | CANDIDATE                 |
| VO-CAND-011 | RealizedQuantity        | Execução/medição        | ✓        | CANDIDATE                 |
| VO-CAND-012 | MarginSnapshot          | Derivado custo/preço    | ✓        | PENDING_BUSINESS_DECISION |
| VO-CAND-013 | CommercialReferenceCode | TERM-015                | ✓        | CANDIDATE                 |
| VO-CAND-014 | PurchaseOrderNumber     | TERM-013                | ✓        | CANDIDATE                 |
| VO-CAND-015 | ExternalSystemId        | TERM-048                | ✓        | CANDIDATE                 |
| VO-CAND-016 | BillingOriginRef        | TERM-041                | ✓        | CANDIDATE                 |
| VO-CAND-017 | AuthorizationAct        | Ato liberação           | ✓        | CANDIDATE                 |
| VO-CAND-018 | BusinessTimestamp       | Instant + TZ policy TBD | ✓        | CANDIDATE                 |
| VO-CAND-019 | AddressLocation         | Localização campo       | ✓        | PENDING_SOURCE_VALIDATION |
| VO-CAND-020 | FileDescriptor          | checksum, mime, size    | ✓        | CANDIDATE                 |
| VO-CAND-021 | NotificationChannel     | email/sms               | ✓        | CANDIDATE                 |
| VO-CAND-022 | RejectionReason         | REJ-* code              | ✓        | CANDIDATE                 |

## MoneyAmount (VO-CAND-006)

| Campo candidato | Notas                                                 |
| --------------- | ----------------------------------------------------- |
| amount          | Decimal/rational — **sem** escolher NUMERIC vs BIGINT |
| currency        | VO-CAND-007                                           |
| Precisão        | MDDP-003 — scale por moeda                            |

## QuantityWithUnit (VO-CAND-008)

Não usar `number` nu sem unidade (EP-012..014).

## IDs

Ver [identity-strategy.md](./identity-strategy.md) — UUID v7 candidato interno.
