# TXN-PESS-001

| Campo | Valor |
| --- | --- |
| Document ID | Análise pessimistic locking |
| Prompt | 13 |

## Mecanismos candidatos (PostgreSQL)

| Mecanismo | Uso |
| --- | --- |
| `SELECT ... FOR UPDATE` | Row lock até fim da TX |
| `SELECT ... FOR UPDATE SKIP LOCKED` | Fila de trabalho — não domínio core |
| `pg_advisory_xact_lock(key)` | Slot recurso abstrato |
| `UNIQUE` + retry on violation | Fallback idempotência |

## Por cenário — comparação OPT vs PESS

| Cenário | Recomendação | Justificativa |
| --- | --- | --- |
| CMD-003 conversão | OPT + UNQ | Dupla conversão bloqueada por constraint |
| CMD-005 liberar OS | OPT OS + **PESS PO** | Saldo PO é corrida financeira |
| CMD-015 alocar recurso | **PESS** | INV-004 exclusividade imediata |
| PO-CONSUME | **PESS** PO row | INV-012 sem lost update |
| CMD-010 concluir OS | OPT | Estado terminal — idempotência |
| CMD-019 faturamento | PESS share ou RR | Evitar double billing |
| CMD-020 nota | OPT + UNQ key | Dup NF impossível |
| CMD-021 pagamento | OPT + UNQ | Dup pagamento |
| CMD-022 documento | **PESS** head version | Monotonic version_number |

## CMD-015 — detalhe PESS

```text
BEGIN RC
  SELECT 1 FROM res.resource_allocation
    WHERE resource_type = ? AND resource_ref = ? AND status = 'ACTIVE'
    FOR UPDATE  -- ou advisory lock no par recurso
  IF exists → REJ-005
  INSERT allocation
COMMIT
```

Alternativa: `pg_advisory_xact_lock(hashtext(resource_ref))` se linha ainda não existe.

## Ordem de lock (deadlock prevention)

1. purchase_order (id asc)
2. service_order
3. resource_allocation
4. document logical_document

Documentar em implementação — TXN-DEC-006.

## Duração do lock

| Regra | Motivo |
| --- | --- |
| Lock só dentro TX curta | Sem I/O externo |
| Sem HTTP dentro FOR UPDATE | Timeout |
| Upload storage antes ou depois TX | external-side-effect-design.md |

## Rejeição de estratégia global pessimistic

Lock pessimista em **todas** OS degradaria throughput operacional. Aplicar cirurgicamente.

## Pendente

Advisory vs row lock em recurso sem linha prévia — spike na implementação.
