# SM-MATRIX-001

| Campo       | Valor                                                    |
| ----------- | -------------------------------------------------------- |
| Document ID | Matriz estado / evento / timestamp / auditoria / métrica |
| Prompt      | 07                                                       |

> Uma palavra pode ter função diferente por contexto.

## Classificação global

| Termo        | SERVICE_ORDER     | ALLOCATION | EXECUTION | NOTIFICATION     | PAYMENT | INVOICE         | Geral             |
| ------------ | ----------------- | ---------- | --------- | ---------------- | ------- | --------------- | ----------------- |
| ASSIGNED     | EVENT + TIMESTAMP | —          | —         | —                | —       | —               | DE-005 AMBIGUOUS  |
| DELIVERED    | —                 | —          | —         | STATE (provedor) | —       | STATE candidato | UNKNOWN           |
| VIEWED       | TIMESTAMP + AUDIT | —          | —         | —                | —       | —               | DE-006 AUDIT_ONLY |
| ACKNOWLEDGED | TIMESTAMP + AUDIT | —          | —         | —                | —       | —               | CMD-007 PENDING   |
| ACCEPTED     | UNKNOWN           | —          | —         | —                | —       | —               | ≠ aprovar medição |
| PROCESSED    | METRIC candidato  | —          | —         | —                | —       | —               | Integração        |
| RETURNED     | UNKNOWN           | —          | —         | —                | —       | CONTESTADA?     | PENDING           |

## Detalhe por termo

### ASSIGNED

| Contexto              | Classificação              | Evidência |
| --------------------- | -------------------------- | --------- |
| OS responsável        | EVENT (DE-005) + TIMESTAMP | EV-084    |
| Estado OS “Atribuída” | **REJEITADO**              | DDP-032   |

### DELIVERED

| Contexto             | Classificação           |
| -------------------- | ----------------------- |
| Notificação provedor | STATE (STATE-CAND-049)  |
| Documento ao cliente | EVENT candidato PENDING |
| OS ao campo          | UNKNOWN                 |

### VIEWED

| Contexto            | Classificação                    |
| ------------------- | -------------------------------- |
| OS pelo responsável | TIMESTAMP + AUDIT (DE-006)       |
| Estado OS           | **REJEITADO**                    |
| Notificação         | METRIC candidato — não estado OS |

### ACKNOWLEDGED

| Contexto      | Classificação               |
| ------------- | --------------------------- |
| OS confirmada | TIMESTAMP + AUDIT (CMD-007) |
| Medição       | UNKNOWN                     |
| Pagamento     | UNKNOWN                     |

### ACCEPTED

| Contexto         | Classificação                              |
| ---------------- | ------------------------------------------ |
| Medição aprovada | STATE (STATE-CAND-024) — não usar ACCEPTED |
| Termo genérico   | UNKNOWN                                    |

### PROCESSED

| Contexto        | Classificação          |
| --------------- | ---------------------- |
| Fila integração | METRIC / TECHNICAL_LOG |
| OS              | UNKNOWN — não adotar   |

### RETURNED

| Contexto            | Classificação           |
| ------------------- | ----------------------- |
| Medição devolvida   | EVENT candidato PENDING |
| Pagamento estornado | SDD-005                 |

## Estados OS confirmados como STATE (candidatos)

RELEASED → STATE-CAND-008; STARTED/EM_EXECUCAO → STATE-CAND-009; COMPLETED → STATE-CAND-010; CANCELLED → STATE-CAND-011.

## Não promover automaticamente

| De               | Para         | Decisão                 |
| ---------------- | ------------ | ----------------------- |
| VIEWED           | ACKNOWLEDGED | BOD-001                 |
| ACKNOWLEDGED     | EM_EXECUCAO  | Guarda separada         |
| PAID             | OS encerrada | Rejeitado               |
| ENTREGUE (notif) | VIEWED       | Handoff humano separado |
