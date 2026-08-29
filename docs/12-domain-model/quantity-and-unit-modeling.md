# DM-QTY-001

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Document ID | Modelagem quantidade e unidade |
| TERM        | TERM-023, TERM-024             |
| Prompt      | 11                             |

## Value object QuantityWithUnit (VO-CAND-008)

```text
QuantityWithUnit
├── value: (rational positivo)
└── unit: UnitOfMeasure (VO-CAND-009)
```

## Distinção EP-011..013

| Fase      | VO / entidade                | AGG                   |
| --------- | ---------------------------- | --------------------- |
| Planejado | VO-CAND-010 PlannedQuantity  | AGG-002 ItemPlanejado |
| Alocado   | atributo recurso/qty?        | AGG-003               |
| Realizado | VO-CAND-011 RealizedQuantity | AGG-004 progresso     |
| Medido    | VO em LinhaMedição           | AGG-006               |

**Proibido** comparar quantidades de unidades diferentes sem conversão explícita (MDDP-009).

## Unidades candidatas (sem fechar enum)

hora, diária, m³, km, unidade, viagem — PENDING_SOURCE_VALIDATION.

## Invariantes

- INV-021 — qty realizada rastreável à execução
- Medição vs realizado — tolerância? CARD-DDP-004

## Conversão de unidade

Não modelada — MDDP-009. Rejeitar medição em unidade incompatível candidato.

## Volume

TARGET_NOT_DEFINED — sem otimização prematura de precisão.
