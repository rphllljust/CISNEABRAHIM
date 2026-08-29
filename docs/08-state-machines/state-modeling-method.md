# SM-METHOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Método de modelagem de estados |
| Prompt | 07 |

## Princípios

1. **Ciclos separados** — SERVICE_REQUEST ≠ SERVICE_ORDER ≠ MEASUREMENT ≠ PAYMENT.
2. **Estado ≠ evento ≠ timestamp** — ver [state-event-timestamp-matrix.md](./state-event-timestamp-matrix.md).
3. **Sem status único global** — proibido `ACTIVE`/`DONE` vagos na OS para tudo.
4. **Candidato, não definitivo** — sem fonte primária, nenhuma SM confirmada.
5. **UI não governa** — estados derivam de regras empresariais, não de conveniência de tela.

## Identificadores

| Tipo | Padrão |
| --- | --- |
| Máquina candidata | SM-CAND-NNN |
| Estado candidato | STATE-CAND-NNN |
| Transição candidata | TR-CAND-NNN |
| Guarda | GUARD-NNN |
| Transição inválida | INV-TR-NNN |
| Decisão pendente | SDD-NNN |

## Status de máquina (SM)

`CANDIDATE` · `PARTIALLY_SUPPORTED` · `PENDING_SOURCE_VALIDATION` · `PENDING_BUSINESS_DECISION` · `ACCEPTED_FOR_FURTHER_MODELING` · `REJECTED` · `SUPERSEDED`

## Status de estado/transição

`CANDIDATE` · `PENDING_SOURCE_VALIDATION` · `PENDING_BUSINESS_DECISION` · `REJECTED`

## Proibições

Código, enum, tabela, migration, workflow engine, script auxiliar, promover VIEWED/ACKNOWLEDGED/PAID como estado OS automaticamente, inventar pausa/reabertura sem DDP.

## Relação com Prompt 06

- CMD → TR-CAND (comando dispara transição)
- INV → GUARD (invariante como guarda)
- DE → efeito pós-transição
- REJ → transição bloqueada

## Relação com Prompt 08+

Aggregates e persistência **não** definidos aqui.
