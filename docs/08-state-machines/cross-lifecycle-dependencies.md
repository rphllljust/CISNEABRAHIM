# SM-XLC-001

| Campo | Valor |
| --- | --- |
| Document ID | Dependências cruzadas entre ciclos |
| Total | 14 (XLC-001..014) |
| Prompt | 07 |

> `--?-->` = relação candidata, não confirmada. Evitar transação distribuída implícita.

## Cadeia operacional → financeira

| ID | De | Para | Relação | Fonte | Status |
| --- | --- | --- | --- | --- | --- |
| XLC-001 | OS LIBERADA | Iniciar execução | `-->` candidato | EV-039, EV-044 | CANDIDATE |
| XLC-002 | OS CONCLUIDA | Permite medição | `--?-->` | EV-045, FR-036 | CANDIDATE |
| XLC-003 | Medição APROVADA | Permite faturamento | `--?-->` | FR-038 | PENDING |
| XLC-004 | Faturamento PREPARADO | Permite liberar | `--?-->` | CMD-019 | CANDIDATE |
| XLC-005 | Faturamento LIBERADO | Permite registrar nota | `--?-->` | FR-039 | PENDING |
| XLC-006 | Nota REGISTRADA | Inicia aging pagamento | `--?-->` | EV-064 | PENDING |
| XLC-007 | Pagamento RECEBIDO | Fecha ciclo financeiro | `--?-->` | DDP-012 | PENDING |

## Cadeia recursos e evidências

| ID | De | Para | Relação | Status |
| --- | --- | --- | --- | --- |
| XLC-008 | Alocação ALOCADA | Execução EM_ANDAMENTO | `--?-->` | CANDIDATE |
| XLC-009 | OS LIBERADA | Planejar/alocar | `-->` | CANDIDATE |
| XLC-010 | Evidência anexada | Medição submetida | `--?-->` | PENDING |
| XLC-011 | OS LIBERADA | Notificação | `--?-->` | DE-004 consumidor | CANDIDATE |

## Efeitos de cancelamento cruzado

| ID | De | Para | Relação | DDP |
| --- | --- | --- | --- | --- |
| XLC-012 | OS CANCELADA | Alocação ativa | `--?-->` compensar | DDP-004 |
| XLC-013 | OS CANCELADA | Medição em curso | `--?-->` cancelar | DDP-004 |
| XLC-014 | Medição rejeitada | Faturamento | `--?-->` bloquear | DDP-010 |

## Anti-padrões rejeitados

| Padrão | Motivo |
| --- | --- |
| OS.status = PAID | Contamina ciclo financeiro |
| VIEWED promove OS | DDP-032 |
| Conclusão OS → nota automática | Sem CMD-020 |
| Entrega notificação → ACK | Handoff separado |

## Consistência

- Preferir **eventos** e **comandos explícitos** entre BCs (Prompt 06).
- Falha em XLC externo não reverte transição local sem política compensação (SDD-007).
