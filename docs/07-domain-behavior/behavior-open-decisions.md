# DBEH-OPEN-001

| Campo | Valor |
| --- | --- |
| Document ID | Decisões abertas de comportamento |
| Total | 14 (BOD-001..BOD-014) |
| Prompt | 06 |

| ID | Pergunta | Artefatos | DDP/DBND |
| --- | --- | --- | --- |
| BOD-001 | ACKNOWLEDGED é comando, evento ou timestamp? | CMD-007, DE-006 | DDP-032 |
| BOD-002 | Chave idempotência solicitação | CMD-001 | DDP-037 |
| BOD-003 | Medição é entidade com ciclo próprio? | CMD-017..018 | DBND-004, DDP-010 |
| BOD-004 | Saga vs transação local na conversão | CMD-003 | DBND-003 |
| BOD-005 | Correção de medição aprovada — comando novo? | — | DDP-010 |
| BOD-006 | Pagamento: comando ou só réplica integração | CMD-021 | DDP-012, DBND-010 |
| BOD-007 | Emitir DE para toda alteração OS ou só marcos | CMD-013 | — |
| BOD-008 | Outbox necessário para integração | IE-* | DDP-014 |
| BOD-009 | Lock distribuído vs exclusão DB | concurrency-matrix | DDP-037 |
| BOD-010 | Pausar/retomar execução — incluir CMD? | — | sem EV |
| BOD-011 | REJ exposto ao usuário vs código interno | REJ-* | — |
| BOD-012 | Versão semântica DE desde já | DE-* | — |
| BOD-013 | Política no-op em liberação repetida | CMD-005 | DDP-037 |
| BOD-014 | Aggregate boundaries Prompt 07 | INV-* | DBND-003, DBND-004 |

Nenhuma BOD respondida neste prompt.
