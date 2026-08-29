# DM-SOFT-001

| Campo       | Valor                      |
| ----------- | -------------------------- |
| Document ID | Soft delete e cancelamento |
| Prompt      | 12                         |

## Princípio central

**Cancelamento empresarial não é exclusão.** Soft delete **não** é solução universal.

## Cancelamento (domínio)

| Entidade          | Mecanismo candidato         | Colunas                      |
| ----------------- | --------------------------- | ---------------------------- |
| so.service_order  | SM cancelamento + timestamp | cancelled_at, status_code    |
| msr.measurement   | SM rejeição/cancelamento    | status_code, decided_at      |
| po.purchase_order | SM PO                       | status_code                  |
| logical_document  | Retenção / arquivamento     | status_code — não deleted_at |

## Onde NÃO usar deleted_at

| Tabela                   | Motivo                                    |
| ------------------------ | ----------------------------------------- |
| aud.domain_history_entry | Append-only — proibido DELETE empresarial |
| inv.informed_invoice     | Registro fiscal informado — imutável      |
| pay.payment_registration | Rastreio financeiro                       |
| exe.progress_entry       | Evidência de realização                   |

## Exclusão física candidata (técnica apenas)

| Tabela                    | Cenário                                     |
| ------------------------- | ------------------------------------------- |
| int.integration_staging   | Purge após processamento + retenção técnica |
| ntf.notification_delivery | Após TTL notificação — **PENDING** retenção |

## Consultas

Filtro por `status_code <> 'CANCELLED'` — não `WHERE deleted_at IS NULL` universal.

## INV-015

CHK-CAND-009: OS não pode ter completed_at e cancelled_at simultâneos.

## Histórico após cancelamento

Registros filhos permanecem para auditoria; novas transições bloqueadas por SM.
