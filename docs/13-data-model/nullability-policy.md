# DM-NULL-001

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | Política de nulabilidade |
| Prompt      | 12                       |

## Princípios

| #   | Regra                                                                        |
| --- | ---------------------------------------------------------------------------- |
| 1   | `NOT NULL` quando coluna é obrigatória em qualquer estado válido da entidade |
| 2   | `NULL` quando valor só existe após transição de estado                       |
| 3   | `NULL` ≠ valor default silencioso — defaults explícitos na migration futura  |
| 4   | FK opcional reflete cardinalidade pendente, não preguiça de modelagem        |

## Por padrão de coluna

| Coluna                           | Default nulabilidade            | Justificativa                   |
| -------------------------------- | ------------------------------- | ------------------------------- |
| `id`                             | NOT NULL                        | PK                              |
| `status_code`                    | NOT NULL                        | Entidade sempre em algum estado |
| `created_at` / `registered_at`   | NOT NULL                        | Rastreio temporal mínimo        |
| `*_at` de conclusão/cancelamento | NULL até evento                 | Semântica de estado             |
| `decision_code`                  | NULL até decisão                | SR em análise                   |
| `party_id` em SR                 | NULL candidato                  | Intake anônimo? — PENDING       |
| FK opcionais (CARD-DDP)          | NULL permitido                  | Cardinalidade aberta            |
| `human_number`                   | NULL até atribuição             | CARD-DDP-011                    |
| `row_version`                    | NOT NULL default 0              | Concorrência                    |
| `currency_code` com amount       | NOT NULL quando amount NOT NULL | Par obrigatório                 |

## Por tabela (resumo)

| Tabela               | Colunas NULL permitidas (candidato)                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| sr.service_request   | party_id, decision_code                                                                                                |
| so.service_order     | service_request_id?, human_number, commercial_reference_id, purchase_order_id, released_at, completed_at, cancelled_at |
| exe.execution_record | completed_at                                                                                                           |
| msr.measurement      | execution_record_id, decided_at                                                                                        |
| inv.informed_invoice | billing_preparation_id? (CARD-DDP-006)                                                                                 |
| bill.billable_item   | — (origem obrigatória INV-007)                                                                                         |
| doc.document_version | superseded_at                                                                                                          |
| po.consumption_entry | service_order_id, measurement_id (CARD-DDP-002)                                                                        |

## Proibido NULL implícito

| Caso                                   | Ação                             |
| -------------------------------------- | -------------------------------- |
| amount sem currency                    | Ambos NOT NULL ou ambos ausentes |
| quantity sem unit                      | Par obrigatório                  |
| storage_object_key em versão publicada | NOT NULL quando status publicado |

## Histórico e audit

`aud.domain_history_entry`: `actor_id` NULL para eventos de sistema; `payload_summary` NOT NULL (mesmo que vazio controlado).
