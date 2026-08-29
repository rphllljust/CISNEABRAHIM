# SM-QG-001 — Prompt 07 completeness report

| Campo | Valor |
| --- | --- |
| Prompt | 07 |
| Título | Máquinas de estado empresariais candidatas |
| Gerado em | 2026-08-28 |
| Resultado | PASS_WITH_RESTRICTIONS |

## Entregáveis

| Item | Esperado | Entregue |
| --- | --- | --- |
| Arquivos em docs/08-state-machines/ | 24 | 24 |
| Ciclos separados | 10 | 10 |
| Código/enum/script | 0 | 0 |
| Máquinas definitivas | 0 | 0 |
| Prompt 08 executado | Não | Não |

## Contagens

| Artefato | Quantidade |
| --- | --- |
| State machines (SM-CAND) | 10 |
| Candidate states (STATE-CAND) | 52 |
| Candidate transitions (TR-CAND) | 48 |
| Transition guards (GUARD) | 28 |
| Invalid transitions (INV-TR) | 22 |
| Terminal states | 18 |
| Reopening decisions pending (SDD-R) | 8 |
| Cross-lifecycle dependencies (XLC) | 14 |
| State decisions pending (SDD) | 8 |
| Test scenarios (TSC) | 22 |

## Quality gate

| Critério | Resultado |
| --- | --- |
| Ciclos separados | PASS |
| Todo estado definido semanticamente | PASS (pendentes marcados) |
| Transição com comando, guarda, resultado | PASS (PENDING onde sem fonte) |
| Estados sem fonte marcados | PASS |
| Cancelamento/reabertura não inventados | PASS |
| VIEWED/ACK classificados, não promovidos | PASS |
| Financeiro não contamina OS | PASS |
| Nenhuma máquina definitiva | PASS |
| Sem código/enum/script | PASS |
| Prompt 08 não executado | PASS |

**Quality gate geral:** PASS_WITH_RESTRICTIONS (SRC-001 não validada; múltiplos PENDING_SOURCE_VALIDATION)

## Restrições

1. SRC-001 permanece `PENDING_BUSINESS_VALIDATION` — todas as SM são CANDIDATE.
2. DDP-004, DDP-005, DDP-010, DDP-012, DDP-032 bloqueiam transições.
3. Pagamento parcial e estorno não confirmados (SDD-004, SDD-005).
4. “Convertida” tratada como vínculo+evento (hipótese SDD-001).

## Rastreabilidade atualizada

- `docs/01-foundation/requirements-traceability.md` — linha Prompt 07
- `docs/00-governance/prompt-execution-log.md` — entrada Prompt 07
- `docs/README.md` — índice `08-state-machines/`

## Próximo passo autorizado

Prompt 08 — **não executado nesta sessão**.
