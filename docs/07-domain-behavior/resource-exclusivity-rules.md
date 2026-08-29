# DBEH-RES-EXCL-001

| Campo       | Valor                              |
| ----------- | ---------------------------------- |
| Document ID | Regras de exclusividade de recurso |
| Prompt      | 06                                 |

| Regra                                             | INV     | CMD     | Comportamento                |
| ------------------------------------------------- | ------- | ------- | ---------------------------- |
| Recurso exclusivo não duplo alocado               | INV-004 | CMD-015 | REJ-005; DE-008              |
| Detecção de conflito publicada                    | —       | —       | FR-028; DSVC-001             |
| Substituição de recurso registrada                | —       | FR-026  | Histórico candidato          |
| Veículo vs equipamento vs mão de obra             | —       | —       | DDP-006, DDP-007 — taxonomia |
| Disponibilidade recurso ≠ disponibilidade sistema | —       | —       | TERM ambíguo separado        |

Planejamento (CMD-014) não exige exclusividade; alocação (CMD-015) sim.
