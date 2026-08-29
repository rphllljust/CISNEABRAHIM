# TXN-DEDUP-001

| Campo | Valor |
| --- | --- |
| Document ID | Detecção de duplicatas |
| Prompt | 13 |

## Estratégias em camadas

| Camada | Mecanismo | Comandos |
| --- | --- | --- |
| Constraint UNQ | PostgreSQL unique violation | 003, 020, 021 |
| UNQ parcial | Alocação ativa | 015 |
| Idempotency record | Resposta cacheada | 001, 017 |
| Inbox message_id | BC-018 | Integração |
| Hash conteúdo | Evidência upload | 016 (PENDING) |

## Mapeamento UNQ-CAND → detecção

| UNQ-CAND | Duplicata detectada | Ação app |
| --- | --- | --- |
| 001 | Solicitação reenviada | Retornar SR existente |
| 004 | Segunda OS mesma SR | Retornar OS existente |
| 005 | Recurso duplo | REJ-005 |
| 006 | Medição dup | REJ-008 |
| 007 | NF dup | REJ-010 |
| 008 | Pagamento dup | REJ pagamento |
| 011 | External id dup | Reconciliar INV-022 |

## Tratamento de violação UNQ

```text
try INSERT
catch UniqueViolation
  if idempotente → SELECT existente → return 200
  else → REJ empresarial
```

**Não** mascarar violação como sucesso genérico sem verificar semântica.

## Duplicata vs reconciliação

| Tipo | Significado |
| --- | --- |
| Duplicata maliciosa/erro | Bloquear |
| Duplicata legítima retry | Retornar mesmo resultado |
| Divergência externa | Reconciliação — valores diferentes mesma key |

## Solicitação intake (CMD-001)

- Canal pode reenviar mesmo payload
- `idempotency_key` do cliente ou hash `(channel, external_message_id)?`
- INV-003

## Evidência (CMD-016)

IDEM-REQ-005 SAFE_REPEAT — dedup por `checksum_sha256` candidato futuro.

## Auditoria de duplicata bloqueada

Registrar tentativa em security/audit log — não domain_history (não houve transição).
