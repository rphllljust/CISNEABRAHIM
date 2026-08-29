# TXN-UC-MAT-001

| Campo       | Valor                                   |
| ----------- | --------------------------------------- |
| Document ID | Matriz transacional por comando crítico |
| Prompt      | 13                                      |

> Para cada comando: boundary · leituras · escritas · invariantes · isolamento · conflito · retry · idempotência · externos · falha commit · reconciliação · audit.

Legenda isolamento: **RC** Read Committed (default), **RR** Repeatable Read, **SER** Serializable.

Legenda lock: **OPT** optimistic (row_version), **PESS** pessimistic (FOR UPDATE), **EXCL** exclusividade recurso.

---

## CMD-003 — Converter solicitação em OS

| Dimensão           | Detalhe                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| Boundary           | CROSS_AGGREGATE_LOCAL (SR + OS + audit)                                  |
| Leituras           | sr.service_request BY id; verificar status decidido; UNQ conversão       |
| Escritas           | UPDATE SR; INSERT so.service_order; INSERT aud (DE-003)                  |
| Invariantes        | INV-001, INV-003                                                         |
| Isolamento         | **RC** + UNQ service_request_id (UNQ-CAND-004)                           |
| Conflito           | Dupla conversão → REJ-001; row_version SR se aplicável                   |
| Retry              | **Não** — UNIQUE_BUSINESS_OPERATION; retorno idempotente da OS existente |
| Idempotência       | Chave: `(idempotency_key \| service_request_id)` → mesma OS              |
| Externos           | Nenhum na TX                                                             |
| Falha antes commit | Rollback — SR inalterado                                                 |
| Falha após commit  | Cliente retry → retorna OS existente (não duplica)                       |
| Reconciliação      | Query SR.id ↔ SO.service_request_id                                      |
| Audit              | DE-003 domain_history_entry na TX                                        |
| Lock               | **OPT** em SR; **PESS** implícito via UNQ                                |

---

## CMD-005 — Liberar OS

| Dimensão           | Detalhe                                                          |
| ------------------ | ---------------------------------------------------------------- |
| Boundary           | SINGLE + PO opcional (CB-003)                                    |
| Leituras           | so.service_order; po.purchase_order se vínculo; elegibilidade SM |
| Escritas           | UPDATE OS status/released_at; consumption_entry?; audit DE-004   |
| Invariantes        | INV-002, INV-012                                                 |
| Isolamento         | **RC**; PO: **PESS** FOR UPDATE em po.purchase_order             |
| Conflito           | Liberação dupla → no-op ou REJ-002 (BOD-013 pending)             |
| Retry              | UNIQUE_BUSINESS_OPERATION — segunda chamada idempotente          |
| Idempotência       | Escopo: `(actor, CMD-005, service_order_id)`                     |
| Externos           | Notificação **após** commit (outbox PROPOSED)                    |
| Falha antes commit | Rollback — não liberada                                          |
| Falha após commit  | Retry → estado já liberado — resposta idempotente                |
| Reconciliação      | status OS vs PO saldo                                            |
| Audit              | DE-004 + AUDIT_TRAIL                                             |
| Lock               | **OPT** row_version OS; **PESS** PO saldo                        |

---

## CMD-015 — Alocar recurso

| Dimensão           | Detalhe                                                               |
| ------------------ | --------------------------------------------------------------------- |
| Boundary           | SINGLE (AGG-003) + verificação cross-read OS                          |
| Leituras           | OS liberada; planned_item; alocações ativas recurso                   |
| Escritas           | INSERT res.resource_allocation                                        |
| Invariantes        | INV-004                                                               |
| Isolamento         | **SER** ou **PESS** em slot recurso — candidato **PESS**              |
| Conflito           | REJ-005; DE-008 se conflito detectado                                 |
| Retry              | Não automático — conflito exposto ao usuário                          |
| Idempotência       | `(resource_type, resource_ref_id, service_order_id, planned_item_id)` |
| Externos           | Nenhum                                                                |
| Falha antes/depois | Rollback; retry idempotente retorna alocação existente                |
| Reconciliação      | —                                                                     |
| Audit              | DE-007                                                                |
| Lock               | **PESS** + UNQ-CAND-005 parcial                                       |

---

## PO-CONSUME — Consumo de saldo PO (com CMD-005 ou dedicado)

| Dimensão           | Detalhe                                                             |
| ------------------ | ------------------------------------------------------------------- |
| Boundary           | CROSS_AGGREGATE_PO (BC-004 write owner)                             |
| Leituras           | po.purchase_order FOR UPDATE; saldo calculado                       |
| Escritas           | INSERT po.consumption_entry; UPDATE balance_amount                  |
| Invariantes        | INV-012                                                             |
| Isolamento         | **PESS** obrigatório no PO root                                     |
| Conflito           | Saldo insuficiente → REJ-011                                        |
| Retry              | Não sem idempotency key em consumption                              |
| Idempotência       | `(purchase_order_id, service_order_id, operation)` TBD CARD-DDP-002 |
| Externos           | Sync PO externo → inbox BC-018                                      |
| Falha antes commit | Rollback liberação se acoplada                                      |
| Falha após commit  | Reconciliação saldo vs soma consumption_entry                       |
| Audit              | DE + financial audit                                                |
| Lock               | **PESS** — FINANCIAL_RACE                                           |
| Status             | PENDING_CARDINALITY                                                 |

---

## CMD-010 — Concluir OS

| Dimensão          | Detalhe                                        |
| ----------------- | ---------------------------------------------- |
| Boundary          | CROSS_READ BC-008 + WRITE BC-006               |
| Leituras          | execution_record completo?; OS status; INV-015 |
| Escritas          | UPDATE OS completed_at; possível SM BC-008     |
| Invariantes       | INV-015, INV-020                               |
| Isolamento        | **RC** + **OPT** row_version OS                |
| Conflito          | Conclusão vs cancelamento → REJ                |
| Retry             | UNIQUE_BUSINESS_OPERATION                      |
| Idempotência      | `(service_order_id, CMD-010)`                  |
| Externos          | Notificação pós-commit                         |
| Falha após commit | Idempotente                                    |
| Reconciliação     | OS completed vs execution state                |
| Audit             | DE-011                                         |
| Lock              | **EXCL** estado OS — **OPT**                   |

---

## CMD-017 — Submeter medição

| Dimensão      | Detalhe                                          |
| ------------- | ------------------------------------------------ |
| Boundary      | SINGLE (AGG-006)                                 |
| Leituras      | OS elegível; execution_record; planned_items     |
| Escritas      | INSERT msr.measurement + lines                   |
| Invariantes   | INV-008, INV-009                                 |
| Isolamento    | **RC**                                           |
| Conflito      | Dup medição → UNQ-CAND-006 / REJ-008             |
| Retry         | IDEMPOTENCY_REQUIRED — mesma medição             |
| Idempotência  | `idempotency_key` + `(service_order_id, cycle?)` |
| Externos      | Nenhum                                           |
| Falha         | Rollback medição parcial                         |
| Reconciliação | qty medida vs realizada                          |
| Audit         | DE-014                                           |
| Lock          | **OPT** row_version measurement                  |

---

## CMD-018 — Decidir sobre medição

| Dimensão     | Detalhe                                |
| ------------ | -------------------------------------- |
| Boundary     | SINGLE                                 |
| Leituras     | measurement status; SoD ator (INV-017) |
| Escritas     | UPDATE measurement decided             |
| Invariantes  | INV-017                                |
| Isolamento   | **RC** + **OPT**                       |
| Retry        | UNIQUE — aprovação dupla no-op         |
| Idempotência | `(measurement_id, decision)`           |
| Externos     | Nenhum                                 |
| Audit        | DE-015                                 |
| Lock         | **OPT**                                |
| Status       | PENDING_BUSINESS_DECISION              |

---

## CMD-019 — Preparar faturamento

| Dimensão      | Detalhe                                                             |
| ------------- | ------------------------------------------------------------------- |
| Boundary      | CROSS_READ medição + WRITE billing (STRONG_TRANSACTIONAL candidato) |
| Leituras      | measurement aprovada; lines; commercial ref?                        |
| Escritas      | billing_preparation + billable_items                                |
| Invariantes   | INV-007                                                             |
| Isolamento    | **RR** candidato na medição (evitar double bill)                    |
| Conflito      | Segundo prep → UNQ-CAND-015 ou REJ                                  |
| Retry         | Não duplicar prep                                                   |
| Idempotência  | `(measurement_id, CMD-019)`                                         |
| Externos      | Nenhum na TX                                                        |
| Falha         | Rollback itens faturáveis                                           |
| Reconciliação | billable vs measurement lines                                       |
| Audit         | DE-016                                                              |
| Lock          | **OPT** + **PESS** share lock medição (opcional)                    |
| Classificação | **FINANCIAL_RACE**                                                  |

---

## CMD-020 — Registrar nota informada

| Dimensão           | Detalhe                                         |
| ------------------ | ----------------------------------------------- |
| Boundary           | SINGLE (AGG-008)                                |
| Leituras           | billing_preparation; external_invoice_key dup   |
| Escritas           | INSERT informed_invoice                         |
| Invariantes        | INV-007, INV-011, INV-018                       |
| Isolamento         | **RC** + UNQ external_invoice_key               |
| Conflito           | Dup NF → REJ-010                                |
| Retry              | IDEMPOTENCY_REQUIRED                            |
| Idempotência       | `external_invoice_key` + client idempotency_key |
| Externos           | ERP read opcional **fora** TX                   |
| Falha antes commit | Sem nota                                        |
| Falha após commit  | Retry retorna nota existente                    |
| Reconciliação      | Financeiro vs ERP                               |
| Audit              | DE-017 FINANCIAL                                |
| Lock               | **OPT**                                         |
| Classificação      | **FINANCIAL_RACE**                              |

---

## CMD-021 — Registrar pagamento

| Dimensão                          | Detalhe                                         |
| --------------------------------- | ----------------------------------------------- |
| Boundary                          | LOCAL + EXTERNAL (EVENTUAL_WITH_RECONCILIATION) |
| Leituras                          | informed_invoice; pagamentos existentes         |
| Escritas                          | INSERT payment_registration                     |
| Invariantes                       | INV-010                                         |
| Isolamento                        | **RC** + UNQ pagamento                          |
| Conflito                          | Dup → REJ                                       |
| Retry                             | IDEMPOTENCY_REQUIRED — crítico                  |
| Idempotência                      | `(informed_invoice_id, external_payment_ref)`   |
| Externos                          | ERP/banco — **nunca** na mesma TX               |
| Falha antes commit                | Sem registro local                              |
| Falha após commit, externo falhou | Registro local + reconciliação                  |
| Reconciliação                     | **Obrigatória** — job BC-018                    |
| Audit                             | DE-018                                          |
| Lock                              | **OPT**                                         |
| Classificação                     | **FINANCIAL_RACE**                              |
| Status                            | PENDING_BUSINESS_DECISION                       |

---

## CMD-022 — Substituir documento

| Dimensão                          | Detalhe                                                   |
| --------------------------------- | --------------------------------------------------------- |
| Boundary                          | SINGLE (AGG-013)                                          |
| Leituras                          | logical_document; última versão                           |
| Escritas                          | INSERT document_version; UPDATE superseded_at anterior    |
| Invariantes                       | INV-013                                                   |
| Isolamento                        | **RC** + UNQ version_number                               |
| Conflito                          | Versão concorrente → retry OPT                            |
| Retry                             | UNIQUE por (document_id, version intent)                  |
| Idempotência                      | `(logical_document_id, content_checksum)`                 |
| Externos                          | Object storage upload **antes** ou staging confirm pós-TX |
| Falha antes commit                | Versão não publicada                                      |
| Falha após commit, storage falhou | Orfão storage — job limpeza                               |
| Reconciliação                     | checksum vs storage                                       |
| Audit                             | DE-019                                                    |
| Lock                              | **OPT** + **PESS** última versão FOR UPDATE               |

---

## Resumo classificação

| Classificação                | Comandos                         |
| ---------------------------- | -------------------------------- |
| STRONG_TRANSACTIONAL         | CMD-003, CMD-019                 |
| STRONG_WITHIN_BOUNDARY       | CMD-005, 015, 017, 020, 022, 010 |
| EVENTUAL_WITH_RECONCILIATION | CMD-021                          |
| FINANCIAL_RACE               | PO-CONSUME, CMD-019, 020, 021    |
