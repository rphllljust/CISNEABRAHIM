# DM-KEY-001

| Campo | Valor |
| --- | --- |
| Document ID | Estratégia de chaves |
| Prompt | 12 |
| Herda | DM-ID-001 (Prompt 11) |

## Primary keys

| Regra | Detalhe |
| --- | --- |
| Tipo | `uuid` — candidato UUID v7 time-ordered |
| Geração | Aplicação (não `serial` exposto) |
| Escopo | Uma PK surrogate por TBL-CAND |
| Exposição API | UUID opaco; `human_number` separado se CARD-DDP-011 fechar |

## Natural keys candidatas (UNQ, não PK)

| Tabela | Natural key candidata | UNQ-CAND | Status |
| --- | --- | --- | --- |
| sr.service_request | idempotency_key | 001 | CANDIDATE |
| so.service_order | service_request_id (1:1) | 004 | PENDING CARD-DDP-008 |
| so.service_order | human_number | 003 | PENDING CARD-DDP-011 |
| inv.informed_invoice | external_invoice_key | 007 | CANDIDATE |
| po.purchase_order | po_number | 010 | CANDIDATE |
| doc.document_version | (logical_document_id, version_number) | 009 | CANDIDATE |
| int.external_id_mapping | (system_code, external_key) | 011 | CANDIDATE |

## Chaves compostas (filhas)

| Tabela | Composição candidata | Propósito |
| --- | --- | --- |
| so.planned_item | (service_order_id, line_number) | UNQ-CAND-012 |
| po.purchase_order_line | (purchase_order_id, line_number) | UNQ-CAND-013 |
| msr.measurement_line | measurement_id + planned_item_id? | UNQ-CAND-014 — CARD-DDP-004 |

## Surrogate vs natural — decisão

| Cenário | PK | Natural key |
| --- | --- | --- |
| Entidade de domínio core | UUID | UNQ onde invariante exige |
| Linha de detalhe | UUID | UNQ composta opcional |
| Evento / histórico | UUID | Sem natural key |
| Staging integração | UUID | external_key em mapping |

## Identificadores externos

- Mapeados em `int.external_id_mapping` — não substituem PK interna (INV-022).
- `external_invoice_key` único em `inv.informed_invoice` quando preenchido (INV-011).

## Não decidido

| ID | Questão |
| --- | --- |
| CARD-DDP-011 | human_number global vs por unidade organizacional |
| MDDP-005 | ULID vs UUID v7 em URL |
