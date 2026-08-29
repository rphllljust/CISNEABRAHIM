# DM-TBL-001

| Campo | Valor |
| --- | --- |
| Document ID | Tabelas candidatas |
| Total | 25 (TBL-CAND-001..025) |
| Prompt | 12 |

---

## TBL-CAND-001 — `sr.service_request`

| Campo | Valor |
| --- | --- |
| Owner | BC-005 |
| AGG | AGG-CAND-001 |
| Finalidade | Solicitação de serviço intake |
| PK | `id` UUID |
| Colunas candidatas | `party_id` FK?; `channel_code`; `status_code`; `decision_code`; `intake_payload_text`? (evitar JSON livre); `registered_at`; `idempotency_key` |
| Nulabilidade | `party_id` TBD; `decision_code` NULL até decisão |
| UNQ | UNQ-CAND-001 idempotency; UNQ-CAND-002 1 OS link |
| INV | INV-001, INV-003 |
| Sensível | intake pode ter PII — classificação RESTRICTED candidata |
| Concorrência | dedup key |
| Status | CANDIDATE |

---

## TBL-CAND-002 — `so.service_order`

| Campo | Valor |
| --- | --- |
| Owner | BC-006 |
| AGG | AGG-CAND-002 |
| PK | `id` UUID |
| Colunas | `service_request_id` FK?; `status_code`; `human_number`?; `commercial_reference_id` FK?; `purchase_order_id` FK?; `released_at`; `completed_at`; `cancelled_at`; `row_version` |
| UNQ | UNQ-CAND-003 human_number?; UNQ-CAND-004 service_request_id (1:1 candidato INV-001) |
| INV | INV-002, INV-015, INV-019 |
| Sensível | não custo/margem aqui |
| Status | CANDIDATE |

---

## TBL-CAND-003 — `so.planned_item`

| Campo | Valor |
| --- | --- |
| Owner | BC-006 |
| AGG | AGG-CAND-002 (filho) |
| PK | `id` UUID |
| FK | `service_order_id` → service_order |
| Colunas | `line_number`; `description`; `planned_quantity_value`; `planned_quantity_unit`; `unit_price_amount`; `unit_price_currency` |
| CHK | CHK-CAND-001 qty > 0 |
| Status | CANDIDATE |

---

## TBL-CAND-004 — `so.responsibility_assignment`

| Campo | Valor |
| --- | --- |
| Owner | BC-006 |
| AGG | pendente MDDP-002 |
| PK | `id` UUID |
| FK | `service_order_id` |
| Colunas | `assignee_actor_id`; `assigned_at`; `viewed_at`?; `acknowledged_at`? |
| Status | PENDING_BUSINESS_DECISION |

---

## TBL-CAND-005 — `res.resource_allocation`

| Campo | Valor |
| --- | --- |
| Owner | BC-007 |
| AGG | AGG-CAND-003 |
| PK | `id` UUID |
| FK | `service_order_id`; `planned_item_id`? |
| Colunas | `resource_type_code`; `resource_ref_id`; `status_code`; `allocated_at`; `released_at` |
| UNQ | UNQ-CAND-005 exclusividade recurso ativo (parcial) |
| INV | INV-004 |
| Status | CANDIDATE |

---

## TBL-CAND-006 — `exe.execution_record`

| Campo | Valor |
| --- | --- |
| Owner | BC-008 |
| AGG | AGG-CAND-004 |
| PK | `id` UUID |
| FK | `service_order_id` — cardinalidade CARD-DDP-003 |
| Colunas | `status_code`; `started_at`; `completed_at` |
| INV | INV-020 |
| Status | PENDING_CARDINALITY |

---

## TBL-CAND-007 — `exe.progress_entry`

| Campo | Valor |
| --- | --- |
| Owner | BC-008 |
| AGG | AGG-CAND-004 filho |
| PK | `id` UUID |
| FK | `execution_record_id` |
| Colunas | `recorded_at`; `realized_quantity_value`; `realized_quantity_unit`; `notes` |
| INV | INV-021 |
| Status | CANDIDATE |

---

## TBL-CAND-008 — `evd.evidence_link`

| Campo | Valor |
| --- | --- |
| Owner | BC-009 |
| AGG | AGG-CAND-005 |
| PK | `id` UUID |
| FK | `execution_record_id`; `logical_document_id` |
| Colunas | `linked_at` |
| Status | CANDIDATE |

---

## TBL-CAND-009 — `msr.measurement`

| Campo | Valor |
| --- | --- |
| Owner | BC-010 |
| AGG | AGG-CAND-006 |
| PK | `id` UUID |
| FK | `service_order_id`; `execution_record_id`? |
| Colunas | `status_code`; `submitted_at`; `decided_at` |
| UNQ | UNQ-CAND-006 candidato anti-dup INV-009 |
| INV | INV-008, INV-009, INV-017 |
| Status | CANDIDATE |

---

## TBL-CAND-010 — `msr.measurement_line`

| Campo | Valor |
| --- | --- |
| Owner | BC-010 |
| PK | `id` UUID |
| FK | `measurement_id`; `planned_item_id`? |
| Colunas | `measured_quantity_value`; `measured_quantity_unit` |
| CHK | CHK-CAND-002 unit not empty |
| Status | CANDIDATE |

---

## TBL-CAND-011 — `bill.billing_preparation`

| Campo | Valor |
| --- | --- |
| Owner | BC-011 |
| AGG | AGG-CAND-007 |
| PK | `id` UUID |
| FK | `measurement_id` — CARD-DDP-005 |
| Colunas | `status_code`; `prepared_at` |
| INV | INV-007 |
| Status | CANDIDATE |

---

## TBL-CAND-012 — `bill.billable_item`

| Campo | Valor |
| --- | --- |
| Owner | BC-011 |
| PK | `id` UUID |
| FK | `billing_preparation_id` |
| Colunas | `origin_ref_type`; `origin_ref_id`; `amount`; `currency_code` |
| Status | CANDIDATE |

---

## TBL-CAND-013 — `inv.informed_invoice`

| Campo | Valor |
| --- | --- |
| Owner | BC-012 |
| AGG | AGG-CAND-008 |
| PK | `id` UUID |
| FK | `billing_preparation_id`? |
| Colunas | `external_invoice_key`; `registered_at`; `total_amount`; `currency_code`; `status_code` |
| UNQ | UNQ-CAND-007 external_invoice_key INV-011 |
| INV | INV-011, INV-018 |
| Sensível | FINANCIAL |
| Status | CANDIDATE |

---

## TBL-CAND-014 — `pay.payment_registration`

| Campo | Valor |
| --- | --- |
| Owner | BC-013 |
| AGG | AGG-CAND-009 |
| PK | `id` UUID |
| FK | `informed_invoice_id` — CARD-DDP-007 |
| Colunas | `amount`; `currency_code`; `registered_at`; `external_payment_ref` |
| UNQ | UNQ-CAND-008 idempotency payment INV-010 |
| Status | PENDING_BUSINESS_DECISION |

---

## TBL-CAND-015 — `doc.logical_document`

| Campo | Valor |
| --- | --- |
| Owner | BC-014 |
| AGG | AGG-CAND-013 |
| PK | `id` UUID |
| Colunas | `document_type_code`; `classification_code`; `business_ref_type`; `business_ref_id`; `status_code` |
| Status | CANDIDATE |

---

## TBL-CAND-016 — `doc.document_version`

| Campo | Valor |
| --- | --- |
| Owner | BC-014 |
| PK | `id` UUID |
| FK | `logical_document_id` |
| Colunas | `version_number`; `storage_object_key`; `checksum_sha256`; `mime_type`; `byte_size`; `published_at`; `superseded_at` |
| UNQ | UNQ-CAND-009 (logical_document_id, version_number) |
| INV | INV-013 |
| Status | CANDIDATE |

---

## TBL-CAND-017 — `po.purchase_order`

| Campo | Valor |
| --- | --- |
| Owner | BC-004 |
| AGG | AGG-CAND-010 |
| PK | `id` UUID |
| Colunas | `po_number`; `status_code`; `balance_amount`; `currency_code` |
| UNQ | UNQ-CAND-010 po_number |
| Status | PENDING_BUSINESS_DECISION |

---

## TBL-CAND-018 — `po.purchase_order_line`

| Campo | Valor |
| --- | --- |
| Owner | BC-004 |
| PK | `id` UUID |
| FK | `purchase_order_id` |
| Colunas | `line_number`; `description`; `authorized_amount`; `currency_code` |
| Status | PENDING_CARDINALITY |

---

## TBL-CAND-019 — `po.consumption_entry`

| Campo | Valor |
| --- | --- |
| Owner | BC-004 |
| AGG | CARD-DDP-002 |
| PK | `id` UUID |
| FK | `purchase_order_id`; `service_order_id`?; `measurement_id`? |
| Colunas | `consumed_amount`; `consumed_at` |
| INV | INV-012 |
| Status | PENDING_CARDINALITY |

---

## TBL-CAND-020 — `com.commercial_reference`

| Campo | Valor |
| --- | --- |
| Owner | BC-003 |
| AGG | AGG-CAND-011 |
| PK | `id` UUID |
| FK | `party_id` |
| Colunas | `reference_code`; `cost_amount`; `price_amount`; `currency_code`; `margin_snapshot`? |
| Sensível | cost — FINANCIAL RESTRICTED |
| INV | INV-005, INV-006 |
| Status | CANDIDATE |

---

## TBL-CAND-021 — `pty.party`

| Campo | Valor |
| --- | --- |
| Owner | BC-002 |
| AGG | AGG-CAND-012 |
| PK | `id` UUID |
| Colunas | `legal_name`; `tax_id`?; `status_code` |
| Sensível | PII |
| Status | CANDIDATE |

---

## TBL-CAND-022 — `ntf.notification_delivery`

| Campo | Valor |
| --- | --- |
| Owner | BC-015 |
| AGG | AGG-CAND-014 |
| PK | `id` UUID |
| Colunas | `channel_code`; `status_code`; `recipient_ref`; `correlation_id`; `service_order_id`? |
| Status | CANDIDATE |

---

## TBL-CAND-023 — `aud.domain_history_entry`

| Campo | Valor |
| --- | --- |
| Owner | BC-017 |
| PK | `id` UUID |
| Colunas | `aggregate_type`; `aggregate_id`; `event_type`; `payload_summary`; `occurred_at`; `actor_id` |
| Append-only | Sim — sem UPDATE/DELETE empresarial |
| Status | CANDIDATE |

---

## TBL-CAND-024 — `int.external_id_mapping`

| Campo | Valor |
| --- | --- |
| Owner | BC-018 |
| PK | `id` UUID |
| Colunas | `system_code`; `external_key`; `internal_type`; `internal_id`; `synced_at` |
| UNQ | UNQ-CAND-011 (system_code, external_key) |
| INV | INV-022 |
| Status | CANDIDATE |

---

## TBL-CAND-025 — `int.integration_staging`

| Campo | Valor |
| --- | --- |
| Owner | BC-018 |
| PK | `id` UUID |
| Colunas | `payload_text`? (último recurso); `status_code`; `received_at` |
| Nota | Evitar JSON sem schema — preferir colunas tipadas quando conhecido |
| Status | CANDIDATE |
