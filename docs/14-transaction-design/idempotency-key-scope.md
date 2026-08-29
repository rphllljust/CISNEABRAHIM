# TXN-IDEM-SCOPE-001

| Campo       | Valor                            |
| ----------- | -------------------------------- |
| Document ID | Escopo de chaves de idempotência |
| Prompt      | 13                               |

## Dimensões de escopo

| Dimensão        | Descrição                         |
| --------------- | --------------------------------- |
| Cliente         | Quem envia (ator, sistema, canal) |
| Comando         | CMD-00X                           |
| Alvo            | aggregate id                      |
| Janela temporal | TTL registro idempotency          |
| Payload         | Hash canonical JSON               |

## Matriz por comando

| CMD        | Escopo mínimo candidato                                 | TTL         | Storage                   |
| ---------- | ------------------------------------------------------- | ----------- | ------------------------- |
| CMD-001    | `(channel, idempotency_key)`                            | 72h         | sr.idempotency_key UNQ    |
| CMD-003    | `(service_request_id)`                                  | ∞ (negócio) | UNQ SO.service_request_id |
| CMD-005    | `(service_order_id, CMD-005)`                           | ∞           | Estado SM                 |
| CMD-015    | `(service_order_id, planned_item_id, resource_ref)`     | ∞           | UNQ alocação              |
| PO-CONSUME | `(purchase_order_id, service_order_id)`                 | TBD         | consumption_entry         |
| CMD-010    | `(service_order_id, CMD-010)`                           | ∞           | completed_at              |
| CMD-017    | `(idempotency_key)` ou `(os_id, submission_cycle)`      | 72h / ∞     | UNQ medição               |
| CMD-019    | `(measurement_id)`                                      | ∞           | UNQ-CAND-015              |
| CMD-020    | `(external_invoice_key)`                                | ∞           | UNQ-CAND-007              |
| CMD-021    | `(external_payment_ref)` ou `(invoice_id, payment_ref)` | ∞           | UNQ-CAND-008              |
| CMD-022    | `(logical_document_id, checksum_sha256)`                | 24h         | versão existente          |

## Header HTTP candidato

```text
Idempotency-Key: <uuid>
```

Escopo implícito: `(tenant?, actor_id, command_name, Idempotency-Key)` — tenant TBD multi-empresa.

## Integração externa

| Sistema           | Chave                                                 |
| ----------------- | ----------------------------------------------------- |
| ERP PO            | `(system_code, external_key)` int.external_id_mapping |
| NF fiscal         | external_invoice_key                                  |
| Webhook pagamento | `(source, message_id)` inbox                          |

## Conflitos de escopo

| Situação                    | Resolução                     |
| --------------------------- | ----------------------------- |
| Mesma key, payload diff     | 409 — não executar            |
| Key nova, operação já feita | UNQ negócio retorna existente |
| Key expirada, op feita      | UNQ negócio ainda protege     |

## Pendente (BOD-002, DDP-037)

Política formal de escopo intake — PENDING_SOURCE_VALIDATION.
