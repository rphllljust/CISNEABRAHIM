# SM-INDEX-001

| Campo | Valor |
| --- | --- |
| Document ID | Máquinas de estado — índice |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Prompt | 07 |

> Máquinas **candidatas**. Nenhuma definitiva. Zero enums, código ou engine.

## Arquivos (24)

| Arquivo | Conteúdo |
| --- | --- |
| [state-modeling-method.md](./state-modeling-method.md) | Método e identificadores |
| [lifecycle-separation.md](./lifecycle-separation.md) | Separação de ciclos |
| [service-request-state-machine.md](./service-request-state-machine.md) | SM-CAND-001 |
| [service-order-state-machine.md](./service-order-state-machine.md) | SM-CAND-002 |
| [allocation-state-machine.md](./allocation-state-machine.md) | SM-CAND-003 |
| [execution-state-machine.md](./execution-state-machine.md) | SM-CAND-004 |
| [measurement-state-machine.md](./measurement-state-machine.md) | SM-CAND-005 |
| [document-state-machine.md](./document-state-machine.md) | SM-CAND-006 |
| [billing-state-machine.md](./billing-state-machine.md) | SM-CAND-007 |
| [invoice-state-machine.md](./invoice-state-machine.md) | SM-CAND-008 |
| [payment-state-machine.md](./payment-state-machine.md) | SM-CAND-009 |
| [notification-delivery-state-machine.md](./notification-delivery-state-machine.md) | SM-CAND-010 |
| [state-transition-register.md](./state-transition-register.md) | TR-CAND-* |
| [transition-guard-register.md](./transition-guard-register.md) | GUARD-* |
| [terminal-state-analysis.md](./terminal-state-analysis.md) | Estados terminais |
| [cancellation-and-reopening-analysis.md](./cancellation-and-reopening-analysis.md) | Cancelamento/reabertura |
| [cross-lifecycle-dependencies.md](./cross-lifecycle-dependencies.md) | Dependências `--?-->` |
| [state-event-timestamp-matrix.md](./state-event-timestamp-matrix.md) | STATE/EVENT/TIMESTAMP |
| [invalid-transition-catalog.md](./invalid-transition-catalog.md) | Transições inválidas |
| [state-machine-test-scenarios.md](./state-machine-test-scenarios.md) | Cenários futuros |
| [state-decisions-pending.md](./state-decisions-pending.md) | SDD-* |
| [state-machine-risks.md](./state-machine-risks.md) | Riscos |
| [prompt-07-completeness-report.md](./prompt-07-completeness-report.md) | Relatório |

## Totais

| Artefato | Quantidade |
| --- | --- |
| Máquinas (SM-CAND) | 10 |
| Estados (STATE-CAND) | 52 |
| Transições (TR-CAND) | 48 |
| Guardas (GUARD) | 28 |
| Transições inválidas (INV-TR) | 22 |
| Estados terminais | 18 |
| Decisões reabertura pendentes (SDD) | 8 |
| Dependências cruzadas (XLC) | 14 |
| Máquinas definitivas | **0** |

## Cadeia

```text
EV → BR → FR/UC → INV → CMD → DE → SM-CAND → STATE-CAND → TR-CAND → GUARD
```
