# DM-ID-001

| Campo | Valor |
| --- | --- |
| Document ID | Estratégia de identidade |
| Prompt | 11 |

## Princípios

1. **Identidade interna** gerada pelo sistema — não expor sequencial adivinhável em API pública.
2. **Identificador externo** (ERP, PO, NF) ≠ necessariamente PK interno (TERM-048).
3. Referências cross-aggregate usam **VO de ID tipado** (VO-CAND-001..005).

## Estratégia candidata

| Tipo | Formato candidato | Gerador | Status |
| --- | --- | --- | --- |
| IDs de domínio | UUID v7 (time-ordered) | Aplicação | CANDIDATE |
| IDs humanos | Número OS exibível? | Sequência segregada | CARD-DDP-011 |
| External ref | VO-CAND-015 + sistema | Integração | CANDIDATE |
| Correlation id | UUID v4 | Comandos idempotentes | CANDIDATE |

## Por aggregate

| AGG | ID interno | ID externo opcional |
| --- | --- | --- |
| 001 | ServiceRequestId | Canal message id? |
| 002 | ServiceOrderId | Número OS candidato |
| 010 | PurchaseOrderId | PO number EXT |
| 008 | InvoiceId | Chave NF fiscal? |
| 013 | DocumentId | — |

## Regras

- Duplicata externa → reconciliação BC-018, não overwrite silencioso (INV-022).
- ID tipado no domínio evita trocar ServiceOrderId por MeasurementId.

## Não decidido

Serialização em URL, ULID vs UUID — MDDP-005.
