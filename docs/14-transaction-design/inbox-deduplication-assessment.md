# TXN-INBOX-001

| Campo | Valor |
| --- | --- |
| Document ID | Avaliação inbox e deduplicação |
| BC | BC-018 External Integration |
| Prompt | 13 |

## Problema

Mensagens externas (webhook ERP, confirmação pagamento, sync PO) podem chegar **duplicadas** ou **fora de ordem**.

## Padrão inbox candidato

```text
RECEIVE message
  INSERT int.integration_staging (message_id, payload, status=RECEIVED)
  ON CONFLICT (system_code, message_id) DO NOTHING
  IF duplicate → 200 ACK (idempotente)
  ELSE process in TX → domain command
```

## Chave deduplicação

| Fonte | Chave |
| --- | --- |
| Webhook | `(system_code, external_message_id)` |
| Polling ERP | `(system_code, external_key, synced_at bucket?)` |
| Pagamento | `external_payment_ref` → CMD-021 |

Alinha UNQ-CAND-011 `external_id_mapping`.

## Processamento

| Etapa | TX |
| --- | --- |
| Persistir staging | RC — insert idempotente |
| Aplicar comando domínio | STRONG_WITHIN_BOUNDARY local |
| Marcar PROCESSED | Mesma TX que domínio candidato |

## Ordenação

**Não** garantir ordem global — comandos devem ser comutativos ou detectar versão (INV-022).

Exemplo: pagamento antigo após novo → reconciliação, não overwrite.

## Relação com outbox

| Direção | Padrão |
| --- | --- |
| Inbound | Inbox dedup |
| Outbound | Outbox PROPOSED |

## staging vs inbox

`int.integration_staging` (TBL-CAND-025) serve ambos papéis candidatos:

- Recebimento bruto (inbox)
- Retry processamento (status PENDING/FAILED)

## Falhas

| Falha | Ação |
| --- | --- |
| Dup message | ACK sem reprocessar |
| Process fail | status FAILED + retry job |
| Poison message | DLQ manual — TBD |

## STATUS

**PROPOSED** — alinhado BC-018; sem implementação.
