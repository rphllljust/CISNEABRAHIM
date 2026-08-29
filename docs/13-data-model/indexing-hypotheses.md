# DM-IDX-001

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Document ID | Hipóteses de indexação |
| Total       | 18 (INDEX_HYPOTHESIS)  |
| Prompt      | 12                     |

> Sem volume e query real — todas marcadas **INDEX_HYPOTHESIS**. Não criar índices na migration inicial sem evidência.

| ID          | Tabela                    | Coluna(s)                                         | Acesso esperado      | Tipo                     |
| ----------- | ------------------------- | ------------------------------------------------- | -------------------- | ------------------------ |
| IDX-HYP-001 | sr.service_request        | idempotency_key                                   | Dedup intake         | UNIQUE INDEX_HYPOTHESIS  |
| IDX-HYP-002 | sr.service_request        | status_code, registered_at                        | Fila análise         | INDEX_HYPOTHESIS         |
| IDX-HYP-003 | so.service_order          | service_request_id                                | Lookup 1:1 SR        | INDEX_HYPOTHESIS         |
| IDX-HYP-004 | so.service_order          | status_code                                       | Listagem operacional | INDEX_HYPOTHESIS         |
| IDX-HYP-005 | so.service_order          | human_number                                      | Busca por número     | UNIQUE INDEX_HYPOTHESIS  |
| IDX-HYP-006 | so.planned_item           | service_order_id                                  | Itens da OS          | INDEX_HYPOTHESIS         |
| IDX-HYP-007 | res.resource_allocation   | (resource_type_code, resource_ref_id) WHERE ativo | INV-004              | PARTIAL INDEX_HYPOTHESIS |
| IDX-HYP-008 | exe.execution_record      | service_order_id                                  | Execução por OS      | INDEX_HYPOTHESIS         |
| IDX-HYP-009 | msr.measurement           | service_order_id                                  | Medições OS          | INDEX_HYPOTHESIS         |
| IDX-HYP-010 | msr.measurement           | status_code                                       | Fila aprovação       | INDEX_HYPOTHESIS         |
| IDX-HYP-011 | bill.billing_preparation  | measurement_id                                    | Prep por medição     | INDEX_HYPOTHESIS         |
| IDX-HYP-012 | inv.informed_invoice      | external_invoice_key                              | Dedup NF             | UNIQUE INDEX_HYPOTHESIS  |
| IDX-HYP-013 | pay.payment_registration  | informed_invoice_id                               | Pagamentos nota      | INDEX_HYPOTHESIS         |
| IDX-HYP-014 | doc.document_version      | logical_document_id                               | Versões doc          | INDEX_HYPOTHESIS         |
| IDX-HYP-015 | aud.domain_history_entry  | (aggregate_type, aggregate_id, occurred_at)       | Timeline aggregate   | INDEX_HYPOTHESIS         |
| IDX-HYP-016 | int.external_id_mapping   | (system_code, external_key)                       | Reconciliação        | UNIQUE INDEX_HYPOTHESIS  |
| IDX-HYP-017 | po.consumption_entry      | purchase_order_id                                 | Saldo PO             | INDEX_HYPOTHESIS         |
| IDX-HYP-018 | ntf.notification_delivery | correlation_id                                    | Rastreio envio       | INDEX_HYPOTHESIS         |

## Não indexar prematuramente

| Caso                     | Motivo                                           |
| ------------------------ | ------------------------------------------------ |
| Todas FK automaticamente | PG não indexa FK por default — avaliar por query |
| JSON/GIN em payload      | Payload não modelado como JSON                   |
| Full-text intake         | Aguarda requisito busca                          |

## Particionamento

TARGET_NOT_DEFINED — sem particionamento por data até volume conhecido.
