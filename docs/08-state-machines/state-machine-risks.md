# SM-RISK-001

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Document ID | Riscos de modelagem de estados |
| Prompt      | 07                             |

| ID      | Risco                                   | Impacto | Mitigação candidata               | Status    |
| ------- | --------------------------------------- | ------- | --------------------------------- | --------- |
| SMR-001 | Status único da OS absorve financeiro   | Alto    | Ciclos separados SM-CAND-007..009 | OPEN      |
| SMR-002 | VIEWED promovido a estado OS            | Médio   | Matriz SM-MATRIX-001; DDP-032     | OPEN      |
| SMR-003 | Transação distribuída implícita OS→nota | Alto    | XLC com `--?-->`; eventos         | OPEN      |
| SMR-004 | Dupla liberação/conclusão               | Médio   | GUARD-021, idempotência           | OPEN      |
| SMR-005 | Cancelamento sem compensação alocação   | Alto    | XLC-012, DDP-004                  | OPEN      |
| SMR-006 | Reabertura sem auditoria                | Alto    | DDP-005, TR-CAND-012 PENDING      | OPEN      |
| SMR-007 | Medição/faturamento sem fonte           | Médio   | PENDING_SOURCE_VALIDATION         | OPEN      |
| SMR-008 | Pagamento parcial/estorno presumido     | Médio   | SDD-004, SDD-005                  | OPEN      |
| SMR-009 | Concorrência alocação                   | Alto    | EXCLUSIVE_RESOURCE                | OPEN      |
| SMR-010 | Notificação ENTREGUE = aceite humano    | Médio   | SM-CAND-010 separado              | OPEN      |
| SMR-011 | Implementação prematura como enum       | Alto    | Proibição Prompt 07               | MITIGATED |
| SMR-012 | Estados vagos ACTIVE/DONE               | Médio   | Definições semânticas STATE-CAND  | MITIGATED |

## Bloqueios para implementação

- 0 máquinas definitivas.
- DDP-004, DDP-005, DDP-032 abertos.
- SRC-001 `PENDING_BUSINESS_VALIDATION`.
