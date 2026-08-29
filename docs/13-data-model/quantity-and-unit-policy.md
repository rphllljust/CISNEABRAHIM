# DM-QTY-001

| Campo       | Valor                            |
| ----------- | -------------------------------- |
| Document ID | Política de quantidade e unidade |
| Herda       | DM-QTY-VO-001 (Prompt 11)        |
| Prompt      | 12                               |

## Par obrigatório

Toda quantidade persistida como:

| Coluna             | Tipo candidato                     |
| ------------------ | ---------------------------------- |
| `*_quantity_value` | `numeric(18, 6)`                   |
| `*_quantity_unit`  | `varchar(32)` — código de catálogo |

## Tabelas

| Tabela               | Colunas                                         |
| -------------------- | ----------------------------------------------- |
| so.planned_item      | planned_quantity_value, planned_quantity_unit   |
| exe.progress_entry   | realized_quantity_value, realized_quantity_unit |
| msr.measurement_line | measured_quantity_value, measured_quantity_unit |

## Regras candidatas

| Regra                           | CHK / validação                      |
| ------------------------------- | ------------------------------------ |
| Unidade não vazia               | CHK-CAND-002                         |
| Planejado > 0                   | CHK-CAND-001                         |
| Realizado >= 0                  | CHK-CAND-003                         |
| Mesma unidade planejado↔medido? | **PENDING** — conversão não modelada |

## Catálogo de unidades

Tabela lookup `ref.unit_of_measure` **não criada** neste prompt — hipótese futura. Até lá: CHECK mínimo + validação domínio.

## Rastreabilidade INV-021

`progress_entry` → `execution_record` → quantidade realizada append-friendly (múltiplas entradas permitidas).

## Volume

Sem agregação pré-calculada de totais na OS — derivar por query ou materialized view BC-016 futura.
