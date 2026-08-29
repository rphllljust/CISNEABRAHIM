# DM-UNQ-001

| Campo | Valor |
| --- | --- |
| Document ID | Constraints de unicidade candidatas |
| Total | 16 (UNQ-CAND-001..016) |
| Prompt | 12 |

| ID | Tabela | Coluna(s) | Invariante / regra | Tipo | Status |
| --- | --- | --- | --- | --- | --- |
| UNQ-CAND-001 | sr.service_request | idempotency_key | INV-003 dedup intake | Empresarial | CANDIDATE |
| UNQ-CAND-002 | so.service_order | service_request_id | INV-001 uma OS por SR | Empresarial | PENDING CARD-DDP-008 |
| UNQ-CAND-003 | so.service_order | human_number | Número OS único | Empresarial | PENDING CARD-DDP-011 |
| UNQ-CAND-004 | so.service_order | service_request_id | Alias candidato 002 | Empresarial | PENDING |
| UNQ-CAND-005 | res.resource_allocation | (resource_type_code, resource_ref_id) WHERE status ativo | INV-004 exclusividade | Parcial | CANDIDATE |
| UNQ-CAND-006 | msr.measurement | (service_order_id, execution_record_id?) | INV-009 anti-dup | Empresarial | PENDING CARD-DDP-004 |
| UNQ-CAND-007 | inv.informed_invoice | external_invoice_key | INV-011 NF duplicada | Externo | CANDIDATE |
| UNQ-CAND-008 | pay.payment_registration | (informed_invoice_id, external_payment_ref) | INV-010 pagamento dup | Externo | PENDING |
| UNQ-CAND-009 | doc.document_version | (logical_document_id, version_number) | INV-013 versão | Empresarial | CANDIDATE |
| UNQ-CAND-010 | po.purchase_order | po_number | PO externo único | Externo | CANDIDATE |
| UNQ-CAND-011 | int.external_id_mapping | (system_code, external_key) | INV-022 mapping | Integração | CANDIDATE |
| UNQ-CAND-012 | so.planned_item | (service_order_id, line_number) | Linha única OS | Estrutural | CANDIDATE |
| UNQ-CAND-013 | po.purchase_order_line | (purchase_order_id, line_number) | Linha PO | Estrutural | CANDIDATE |
| UNQ-CAND-014 | msr.measurement_line | (measurement_id, planned_item_id) | Uma linha medida por item | Empresarial | PENDING CARD-DDP-004 |
| UNQ-CAND-015 | bill.billing_preparation | measurement_id | 1 prep por medição? | Empresarial | PENDING CARD-DDP-005 |
| UNQ-CAND-016 | com.commercial_reference | reference_code | Código comercial único | Empresarial | CANDIDATE |

## Tipos de unicidade

| Tipo | Descrição |
| --- | --- |
| Empresarial | Reflete regra de negócio confirmada ou candidata |
| Estrutural | Integridade de composição (linha N) |
| Externo | Chave de sistema terceiro |
| Parcial | Índice único com predicado (ex.: alocação ativa) |

## Unicidade vs cardinalidade

Constraints UNQ **não** fecham CARD-DDP — apenas registram hipótese quando invariante sugere 1:1.

## Não aplicar

| Caso | Motivo |
| --- | --- |
| UNQ em status histórico múltiplo | Estados coexistem no tempo |
| UNQ global em soft-deleted rows | Cancelamento ≠ delete |
