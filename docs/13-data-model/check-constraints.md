# DM-CHK-001

| Campo       | Valor                        |
| ----------- | ---------------------------- |
| Document ID | Check constraints candidatas |
| Total       | 14 (CHK-CAND-001..014)       |
| Prompt      | 12                           |

| ID           | Tabela                   | Regra candidata                                             | Invariante | Status    |
| ------------ | ------------------------ | ----------------------------------------------------------- | ---------- | --------- |
| CHK-CAND-001 | so.planned_item          | planned_quantity_value > 0                                  | —          | CANDIDATE |
| CHK-CAND-002 | msr.measurement_line     | measured_quantity_unit <> ''                                | INV-008    | CANDIDATE |
| CHK-CAND-003 | exe.progress_entry       | realized_quantity_value >= 0                                | INV-021    | CANDIDATE |
| CHK-CAND-004 | bill.billable_item       | amount >= 0                                                 | INV-007    | CANDIDATE |
| CHK-CAND-005 | inv.informed_invoice     | total_amount >= 0                                           | INV-011    | CANDIDATE |
| CHK-CAND-006 | pay.payment_registration | amount > 0                                                  | INV-010    | PENDING   |
| CHK-CAND-007 | po.purchase_order        | balance_amount >= 0                                         | INV-012    | PENDING   |
| CHK-CAND-008 | po.consumption_entry     | consumed_amount > 0                                         | INV-012    | PENDING   |
| CHK-CAND-009 | so.service_order         | NOT (completed_at IS NOT NULL AND cancelled_at IS NOT NULL) | INV-015    | CANDIDATE |
| CHK-CAND-010 | doc.document_version     | version_number > 0                                          | INV-013    | CANDIDATE |
| CHK-CAND-011 | doc.document_version     | byte_size >= 0                                              | —          | CANDIDATE |
| CHK-CAND-012 | com.commercial_reference | price_amount >= 0 AND cost_amount >= 0                      | INV-005    | CANDIDATE |
| CHK-CAND-013 | msr.measurement          | decided_at IS NULL OR decided_at >= submitted_at            | Temporal   | CANDIDATE |
| CHK-CAND-014 | exe.execution_record     | completed_at IS NULL OR completed_at >= started_at          | Temporal   | CANDIDATE |

## Categorias

| Categoria                     | Exemplos                              |
| ----------------------------- | ------------------------------------- |
| Valores monetários            | amount >= 0; currency_code length = 3 |
| Quantidades                   | > 0 planejado; >= 0 realizado         |
| Intervalos de datas           | fim >= início                         |
| Estados mutuamente exclusivos | completed XOR cancelled timestamp     |
| Versão documental             | version_number positivo               |

## O que não vai em CHECK (validação de aplicação)

| Regra                                | Motivo                          |
| ------------------------------------ | ------------------------------- |
| SM transition válida                 | Máquina de estado — trigger/app |
| SoD medição (INV-017)                | Autorização BC-009              |
| OS liberada antes execução (INV-020) | Cross-aggregate + SM            |
| Margem autorizada (INV-006)          | Autorização                     |

## Moeda (complemento)

CHK adicional candidato: `currency_code ~ '^[A-Z]{3}$'` em todas tabelas monetárias — registrar na migration futura, não DDL agora.

## Unidade

`planned_quantity_unit` e `measured_quantity_unit` devem pertencer a catálogo — CHECK com lookup table futura ou enum controlado.
