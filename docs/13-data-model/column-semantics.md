# DM-COL-SEM-001

| Campo       | Valor                           |
| ----------- | ------------------------------- |
| Document ID | Semântica de colunas candidatas |
| Prompt      | 12                              |

## Convenções de nome

| Sufixo / prefixo               | Significado                                  | Tipo candidato        |
| ------------------------------ | -------------------------------------------- | --------------------- |
| `_id`                          | FK ou referência interna UUID                | `uuid`                |
| `_code`                        | Valor de enum / lookup controlado            | `varchar` curto       |
| `_at`                          | Instantâneo de evento (UTC)                  | `timestamptz`         |
| `_amount`                      | Valor monetário sem sinal de moeda na coluna | `numeric(19,4)`       |
| `_currency` / `_currency_code` | ISO 4217                                     | `char(3)`             |
| `_value` + `_unit`             | Par quantidade + unidade                     | `numeric` + `varchar` |
| `status_code`                  | Estado atual da entidade (SM-CAND)           | `varchar`             |
| `row_version`                  | Controle otimista                            | `bigint` ou `integer` |
| `external_*`                   | Identificador de sistema externo             | `varchar`             |

## Colunas por categoria

### Identidade e rastreio

| Coluna            | Semântica                           | Tabelas                                      |
| ----------------- | ----------------------------------- | -------------------------------------------- |
| `id`              | PK surrogate UUID v7                | Todas TBL-CAND                               |
| `idempotency_key` | Chave de deduplicação de comando    | sr.service_request, pay.payment_registration |
| `correlation_id`  | Correlação assíncrona / notificação | ntf.notification_delivery                    |
| `human_number`    | Número exibível OS (não PK)         | so.service_order                             |

### Estado empresarial

| Coluna          | Semântica                            | Nulável até            |
| --------------- | ------------------------------------ | ---------------------- |
| `status_code`   | Estado atual validado por SM         | nunca após criação     |
| `decision_code` | Decisão de intake (aprovar/rejeitar) | decisão tomada         |
| `cancelled_at`  | Marca cancelamento empresarial       | nunca se não cancelado |

### Monetário (ver monetary-data-policy.md)

| Coluna               | Semântica                                                                         |
| -------------------- | --------------------------------------------------------------------------------- |
| `amount`, `*_amount` | Quantia em minor units ou decimal fixo — **sempre** com `currency_code` adjacente |
| `balance_amount`     | Saldo PO remanescente candidato                                                   |

### Quantidade (ver quantity-and-unit-policy.md)

| Coluna                    | Semântica                          |
| ------------------------- | ---------------------------------- |
| `planned_quantity_value`  | Quantidade planejada na OS         |
| `realized_quantity_value` | Quantidade realizada na execução   |
| `measured_quantity_value` | Quantidade medida para faturamento |

### Documental

| Coluna                | Semântica                                   |
| --------------------- | ------------------------------------------- |
| `storage_object_key`  | Referência object storage — não é o arquivo |
| `checksum_sha256`     | Integridade da versão                       |
| `logical_document_id` | Agregado documental — versões em filha      |

### Integração

| Coluna                         | Semântica                            |
| ------------------------------ | ------------------------------------ |
| `external_invoice_key`         | Chave NF informada (BC-012)          |
| `external_payment_ref`         | Referência pagamento ERP             |
| `system_code` + `external_key` | Par único em int.external_id_mapping |

## O que evitar

| Anti-padrão                              | Motivo                              |
| ---------------------------------------- | ----------------------------------- |
| `jsonb` genérico para payload de domínio | Sem schema; dificulta constraints   |
| `deleted_at` universal                   | Ver soft-delete-and-cancellation.md |
| `float` / `double` para dinheiro         | Perda de precisão                   |
| PK natural de ERP como única chave       | INV-022, reconciliação              |

## Classificação sensível (colunas)

| Classificação | Exemplos                                 |
| ------------- | ---------------------------------------- |
| PUBLIC        | status_code, human_number                |
| INTERNAL      | planned quantities, line numbers         |
| RESTRICTED    | intake_payload_text, tax_id, cost_amount |
| FINANCIAL     | amount, balance_amount, margin_snapshot  |
