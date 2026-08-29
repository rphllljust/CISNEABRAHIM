# DM-FK-001

| Campo               | Valor                             |
| ------------------- | --------------------------------- |
| Document ID         | Estratégia de chaves estrangeiras |
| Total FK candidatas | 32                                |
| Prompt              | 12                                |

## Princípios

| #   | Regra                                                         |
| --- | ------------------------------------------------------------- |
| 1   | FK aponta para PK surrogate do aggregate owner                |
| 2   | Cross-schema permitido quando ownership de leitura é claro    |
| 3   | Cardinalidade incerta → FK opcional + CARD-DDP aberta         |
| 4   | Sem FK para BC-016 (reporting) — somente leitura              |
| 5   | Histórico (`aud`) sem FK obrigatória — referência por tipo+id |

## FK candidatas por fluxo

### Intake → OS (CMD-003, mesma transação)

| De                                       | Para                        | Cardinalidade | CARD-DDP |
| ---------------------------------------- | --------------------------- | ------------- | -------- |
| so.service_order.service_request_id      | sr.service_request.id       | 0..1:1        | 008      |
| so.service_order.party_id                | pty.party.id                | N:1           | —        |
| so.service_order.commercial_reference_id | com.commercial_reference.id | N:1           | 009      |
| so.service_order.purchase_order_id       | po.purchase_order.id        | N:1           | —        |

### OS e filhos

| De                                            | Para                | Obrigatório |
| --------------------------------------------- | ------------------- | ----------- |
| so.planned_item.service_order_id              | so.service_order.id | Sim         |
| so.responsibility_assignment.service_order_id | so.service_order.id | Sim         |
| res.resource_allocation.service_order_id      | so.service_order.id | Sim         |
| res.resource_allocation.planned_item_id       | so.planned_item.id  | TBD         |

### Execução e evidência

| De                                     | Para                    | CARD-DDP |
| -------------------------------------- | ----------------------- | -------- |
| exe.execution_record.service_order_id  | so.service_order.id     | 003      |
| exe.progress_entry.execution_record_id | exe.execution_record.id | —        |
| evd.evidence_link.execution_record_id  | exe.execution_record.id | —        |
| evd.evidence_link.logical_document_id  | doc.logical_document.id | 012      |

### Medição → Faturamento → Nota → Pagamento

| De                                           | Para                        | CARD-DDP |
| -------------------------------------------- | --------------------------- | -------- |
| msr.measurement.service_order_id             | so.service_order.id         | 004      |
| msr.measurement.execution_record_id          | exe.execution_record.id     | TBD      |
| msr.measurement_line.measurement_id          | msr.measurement.id          | —        |
| msr.measurement_line.planned_item_id         | so.planned_item.id          | 004      |
| bill.billing_preparation.measurement_id      | msr.measurement.id          | 005      |
| bill.billable_item.billing_preparation_id    | bill.billing_preparation.id | —        |
| inv.informed_invoice.billing_preparation_id  | bill.billing_preparation.id | 006      |
| pay.payment_registration.informed_invoice_id | inv.informed_invoice.id     | 007      |

### PO e comercial

| De                                       | Para                 | CARD-DDP |
| ---------------------------------------- | -------------------- | -------- |
| po.purchase_order_line.purchase_order_id | po.purchase_order.id | —        |
| po.consumption_entry.purchase_order_id   | po.purchase_order.id | 002      |
| po.consumption_entry.service_order_id    | so.service_order.id  | 002      |
| po.consumption_entry.measurement_id      | msr.measurement.id   | 002      |
| com.commercial_reference.party_id        | pty.party.id         | —        |

### Documento

| De                                       | Para                    |
| ---------------------------------------- | ----------------------- |
| doc.document_version.logical_document_id | doc.logical_document.id |

### Notificação

| De                                         | Para                           |
| ------------------------------------------ | ------------------------------ |
| ntf.notification_delivery.service_order_id | so.service_order.id (opcional) |

## ON DELETE / ON UPDATE (hipótese — sem DDL)

| Cenário             | Política candidata              |
| ------------------- | ------------------------------- |
| Filho de aggregate  | RESTRICT — exclusão via domínio |
| Referência cross-BC | RESTRICT ou NO ACTION           |
| Staging integração  | CASCADE purge técnico apenas    |
| Audit               | Sem FK cascade                  |

## FK adiada (sem constraint física inicial?)

| Par             | Motivo                 |
| --------------- | ---------------------- |
| int → domínio   | Carga histórica BC-018 |
| reporting views | Sem write              |

## Relacionamentos sem FK (referência lógica)

| Tabela                   | Colunas                        | Motivo                      |
| ------------------------ | ------------------------------ | --------------------------- |
| aud.domain_history_entry | aggregate_type, aggregate_id   | Append-only cross-aggregate |
| bill.billable_item       | origin_ref_type, origin_ref_id | Polimórfico — validação app |
