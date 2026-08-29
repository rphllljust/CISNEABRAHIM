# TXN-FIN-001

| Campo               | Valor                         |
| ------------------- | ----------------------------- |
| Document ID         | Análise corridas financeiras  |
| Prompt              | 13                            |
| Classificação fonte | QATTR-CONC-001 FINANCIAL_RACE |

## Operações classificadas FINANCIAL_RACE

| Operação                | CMD              | Risco                     | Estratégia candidata             |
| ----------------------- | ---------------- | ------------------------- | -------------------------------- |
| Consumo saldo PO        | PO-CONSUME / 005 | Saldo negativo silencioso | PESS FOR UPDATE PO + CHK balance |
| Preparar faturamento    | CMD-019          | Double billing            | RR read medição + UNQ prep       |
| Registrar nota          | CMD-020          | NF duplicada              | UNQ external_invoice_key         |
| Registrar pagamento     | CMD-021          | Pagamento duplicado       | UNQ + idempotency                |
| Alterar custo comercial | CMD-013?         | Margem incorreta          | Authz + OPT                      |
| Reserva PO na liberação | CMD-005          | Duplo consumo             | TX acoplada PO+OS                |

## Padrão read-modify-write perigoso

```text
-- PROIBIDO sem lock
SELECT balance FROM po WHERE id = ?
-- outra TX decrementa aqui
UPDATE po SET balance = balance - ? WHERE id = ?
```

**Correção candidata:**

```text
SELECT balance FROM po WHERE id = ? FOR UPDATE
-- validar >= consumo
UPDATE po SET balance = balance - ?, row_version = row_version + 1 WHERE id = ?
```

## Invariantes financeiras × mecanismo

| INV     | Mecanismo                            |
| ------- | ------------------------------------ |
| INV-007 | origin_ref obrigatório billable_item |
| INV-010 | UNQ-CAND-008 pagamento               |
| INV-011 | UNQ-CAND-007 NF                      |
| INV-012 | PESS + CHK-CAND-007                  |
| INV-006 | Sem constraint — autorização         |

## Separação conceitual (INV-005)

Custo ≠ preço — corridas em `commercial_reference` não afetam `billable_item` diretamente.

## Reconciliação obrigatória

| Fluxo    | Quando                                   |
| -------- | ---------------------------------------- |
| CMD-021  | Sempre — local vs ERP                    |
| CMD-020  | Opcional — chave NF vs sistema fiscal    |
| PO saldo | Periodic job soma consumption vs balance |

## Nenhum lost update silencioso

Toda operação FINANCIAL_RACE deve falhar barulhentamente ou ser idempotente — nunca "último ganha" sem versão.

## Pendente

Estorno e nota de crédito — fora escopo; compensação manual compensation-analysis.md.
