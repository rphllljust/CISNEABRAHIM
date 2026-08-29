# SM-TERM-001

| Campo | Valor |
| --- | --- |
| Document ID | Análise de estados terminais |
| Total terminais | 18 |
| Prompt | 07 |

> Terminal = sem transição de saída **confirmada** no ciclo, salvo reabertura explícita (DDP).

## Por máquina

| SM | Estado | ID | Reversível? | Fonte | Notas |
| --- | --- | --- | --- | --- | --- |
| SM-CAND-001 | REJEITADA | STATE-CAND-004 | Não confirmado | PENDING | |
| SM-CAND-001 | CANCELADA | STATE-CAND-005 | Não | DDP-004 | |
| SM-CAND-002 | CONCLUIDA | STATE-CAND-010 | DDP-005 | EV-045 | Reabertura não confirmada |
| SM-CAND-002 | CANCELADA | STATE-CAND-011 | Não | EV-046 | |
| SM-CAND-003 | SUBSTITUIDA | STATE-CAND-015 | Não | PENDING | |
| SM-CAND-003 | LIBERADA | STATE-CAND-016 | Não | PENDING | |
| SM-CAND-003 | CANCELADA | STATE-CAND-017 | Não | DDP-004 | |
| SM-CAND-004 | CONCLUIDA | STATE-CAND-020 | DDP-005 | EV-045 | |
| SM-CAND-005 | APROVADA | STATE-CAND-024 | Correção? | DDP-010 | |
| SM-CAND-005 | CANCELADA | STATE-CAND-027 | Não | DDP-004 | |
| SM-CAND-006 | INVALIDADA | STATE-CAND-031 | Não | PENDING | |
| SM-CAND-006 | Versão substituída | STATE-CAND-V03 | Não | DE-019 | |
| SM-CAND-007 | LIBERADO | STATE-CAND-035 | Reset? | PENDING | SDD-007 |
| SM-CAND-008 | CANCELADA | STATE-CAND-040 | Não | DDP-004 | |
| SM-CAND-009 | RECEBIDO | STATE-CAND-043 | Estorno? | SDD-005 | |
| SM-CAND-010 | ENTREGUE | STATE-CAND-049 | Não | Candidato | ≠ VIEWED |
| SM-CAND-010 | FALHOU | STATE-CAND-050 | Retry | SDD-006 | Pode não ser terminal final |
| SM-CAND-010 | DESCARTADA | STATE-CAND-051 | Não | Candidato | |

## Estados não-terminais com saída obrigatória

| Estado | Saída esperada |
| --- | --- |
| REJEITADA (medição) | CORRIGIDA ou CANCELADA |
| BLOQUEADO (faturamento) | LIBERADO ou reset |

## Implicações

- Terminal operacional (OS CONCLUIDA) ≠ terminal financeiro (PAGAMENTO RECEBIDO).
- Promover VIEWED como terminal de handoff: **rejeitado** (DDP-032).
