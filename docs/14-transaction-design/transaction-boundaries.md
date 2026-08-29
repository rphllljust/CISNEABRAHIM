# TXN-BND-001

| Campo | Valor |
| --- | --- |
| Document ID | Transaction boundaries |
| Prompt | 13 |
| Estilo | Modular monolith (ADR-001 PROPOSED) |

## Tipos de boundary

| Tipo | Significado | Exemplo |
| --- | --- | --- |
| SINGLE_AGGREGATE | Uma transação, um root | CMD-017 medição |
| CROSS_AGGREGATE_LOCAL | Mesma conexão PG, múltiplos módulos | CMD-003 SR+OS |
| CROSS_AGGREGATE_PO | OS + PO saldo (BC-006 + BC-004) | CMD-005 com PO |
| READ_ONLY | Sem escrita | Consultas BC-016 |
| EXTERNAL_BOUNDARY | Commit local + efeito assíncrono | CMD-021 pagamento |

## Boundaries por aggregate

| AGG | BC | Escrita owner | Transação típica |
| --- | --- | --- | --- |
| AGG-001 ServiceRequest | BC-005 | BC-005 | SINGLE ou com OS (CMD-003) |
| AGG-002 ServiceOrder | BC-006 | BC-006 | SINGLE; cross com SR |
| AGG-003 ResourceAllocation | BC-007 | BC-007 | SINGLE + lock recurso |
| AGG-004 ExecutionRecord | BC-008 | BC-008 | SINGLE |
| AGG-006 Measurement | BC-010 | BC-010 | SINGLE |
| AGG-007 BillingPreparation | BC-011 | BC-011 | SINGLE ou cross medição |
| AGG-008 InformedInvoice | BC-012 | BC-012 | SINGLE |
| AGG-009 PaymentRegistration | BC-013 | BC-013 | LOCAL + EXTERNAL |
| AGG-010 PurchaseOrder | BC-004 | BC-004 | Participante em CMD-005 |
| AGG-013 Document | BC-014 | BC-014 | SINGLE (+ storage pós-commit) |

## Boundaries cross-module explícitos

### CB-002 — Conversão solicitação (CMD-003)

```text
BEGIN
  UPDATE sr.service_request (status, vínculo)
  INSERT so.service_order (+ link service_request_id)
  INSERT aud.domain_history_entry (DE-003)
COMMIT
```

- **Atomicidade:** STRONG_TRANSACTIONAL (WF-001, NFR-003)
- **Rollback:** ambos ou nenhum — sem OS órfã
- **Módulos:** BC-005 handler orquestra; BC-006 persiste OS

### CB-003 — Liberação com PO (CMD-005 + consumo PO)

```text
BEGIN
  SELECT po.purchase_order FOR UPDATE  -- candidato pessimistic
  UPDATE so.service_order (released)
  INSERT po.consumption_entry? / UPDATE balance
  INSERT aud...
COMMIT
```

- **Pendente:** CARD-DDP-002 shape do consumo
- **INV-012:** saldo PO na mesma transação candidata

### CB-004 — Preparar faturamento (CMD-019)

```text
BEGIN
  READ msr.measurement (aprovada)
  INSERT bill.billing_preparation + billable_items
COMMIT
```

- STRONG_TRANSACTIONAL candidato (transaction-classification.md)
- Medição não alterada — somente leitura com lock share opcional

## O que fica fora da transação de domínio

| Efeito | Quando | Mecanismo candidato |
| --- | --- | --- |
| Upload arquivo S3 | CMD-016, CMD-022 | Pré-upload staging; confirm na TX |
| Notificação email/push | CMD-005, DE-* | Pós-commit / outbox PROPOSED |
| Sync ERP pagamento | CMD-021 | Inbox + reconciliação |
| Webhook externo | BC-018 | Inbox dedup |

## Regra de ouro

Um aggregate = um boundary de **consistência de negócio**. Cross-aggregate só com invariante transversal documentada (INV-001, INV-012) e transação local explícita.

## Anti-padrões rejeitados

| Padrão | Motivo |
| --- | --- |
| Saga distribuída agora | Monolith; ADR-004 |
| 2PC multi-database | Não aplicável |
| Evento antes do commit | Dual-write sem outbox |
| Transação aberta durante upload HTTP | Timeout e lock prolongado |
