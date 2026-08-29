# TXN-EXT-001

| Campo | Valor |
| --- | --- |
| Document ID | Efeitos colaterais externos |
| Prompt | 13 |

## Regra central

**Efeitos externos separados do commit local** — nunca HTTP/ERP/S3/email dentro da mesma transação DB que persiste domínio.

## Classificação efeitos

| Efeito | Tipo | Timing candidato |
| --- | --- | --- |
| Persistência domínio PG | LOCAL | Na TX |
| domain_history_entry | LOCAL | Na TX |
| Email/notificação | EXTERNAL | Pós-commit / outbox |
| Object storage put | EXTERNAL | Staging antes; confirm após |
| ERP sync pagamento | EXTERNAL | Inbox/outbox BC-018 |
| Webhook outbound | EXTERNAL | Outbox PROPOSED |

## Padrões por comando

### CMD-005 — Notificação liberação

```text
TX: liberar OS
COMMIT
→ publicar evento notificação (outbox ou handler @AfterCommit)
```

### CMD-016 / CMD-022 — Documento

```text
Opção A (preferida):
  Upload staging (key temp)
  TX: INSERT document_version + checksum
  COMMIT
  → promote object / delete staging on failure job

Opção B:
  TX reserva version_number
  COMMIT
  → upload async — risco órfão mitigado por job
```

### CMD-021 — Pagamento

```text
TX: INSERT payment_registration local
COMMIT
→ worker opcional notifica ERP (não bloqueia commit)
← inbox recebe confirmação banco (reconciliação)
```

## Falha após commit, antes externo

| Estado | Ação |
| --- | --- |
| Domínio consistente | Job retry externo |
| Externo nunca chamado | Outbox PENDING |
| Externo falhou | Retry + reconciliação |

## Falha externo antes commit

Não iniciar TX de domínio dependente do externo — exceto leitura validação **read-only** fora TX.

## Dual-write proibido

```text
PROIBIDO:
  BEGIN
    UPDATE domain
    http.post(erp)  -- se HTTP ok mas rollback → inconsistência
  COMMIT
```

## ADR-004 alinhamento

Consistência forte local; eventual na borda — este documento operacionaliza.
