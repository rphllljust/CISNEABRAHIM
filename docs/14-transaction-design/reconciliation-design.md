# TXN-RECON-001

| Campo | Valor |
| --- | --- |
| Document ID | Design de reconciliação |
| Prompt | 13 |

## Quando reconciliar

| Fluxo | Trigger | Fonte verdade candidata |
| --- | --- | --- |
| CMD-003 conversão | Auditoria | SR ↔ OS link |
| CMD-021 pagamento | Diário + após timeout | ERP/banco vs local |
| CMD-020 nota | Semanal | Chave NF externa |
| PO saldo | Após consumo + job | Soma consumption vs balance |
| Integração mapping | Contínuo | external_id_mapping |
| Medição vs execução | Pré-faturamento | qty lines |

## Tipos reconciliação

| Tipo | Descrição |
| --- | --- |
| Existencial | Registro existe em ambos lados? |
| Valor | Amounts iguais? |
| Estado | SM alinhado? |
| Cardinalidade | 1:1 SR-OS |

## Job candidato `reconciliation_run` (futuro)

| Campo | Função |
| --- | --- |
| run_type | PAYMENT / PO / INVOICE |
| started_at, finished_at | — |
| discrepancies_count | — |
| status | COMPLETED / NEEDS_ACTION |

## Discrepância — ações

| Severidade | Ação |
| --- | --- |
| Dup bloqueado na origem | Nenhuma — UNQ funcionou |
| Local sem externo | Retry outbound ou manual |
| Externo sem local | Inbox reprocess ou CMD manual |
| Valor divergente | Ticket financeiro — **não** auto-corrigir |

## CMD-021 — fluxo reconciliação

```text
1. Listar payment_registration últimas 24h
2. Comparar ERP API (read-only)
3. Marcar MATCHED / UNMATCHED / AMOUNT_MISMATCH
4. Alertar UNMATCHED
```

## INV-016

Integração não produz sucesso local falso — reconciliação detecta falso positivo.

## Não é reconciliação

| Caso | É |
| --- | --- |
| Idempotency replay | Comportamento normal |
| Concurrency 409 | Conflito simultâneo |
| Estorno | Compensação — compensation-analysis.md |

## BC-016 Reporting

Read models podem lag — reconciliação operacional usa SoT write tables.

## Pendente

SLA reconciliação pagamento — DDP-012.
