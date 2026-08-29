# Template — risco (RISK)

## Campos obrigatórios

| Campo                 | Obrigatório                                    |
| --------------------- | ---------------------------------------------- |
| ID (`RISK-NNN`)       | Sim                                            |
| Title                 | Sim                                            |
| Description           | Sim                                            |
| Status                | Sim                                            |
| Probability           | Sim — usar `UNKNOWN` sem evidência             |
| Impact                | Qualitativo se não houver dado; não inventar % |
| Affected assets       | Sim ou `TBD`                                   |
| Related BR / DDP / ED | Se houver                                      |
| Nearby controls       | Sim ou `NONE_YET`                              |
| Residual risk         | `TBD` até avaliação                            |
| Date identified       | Sim                                            |

## Status permitidos

```text
OPEN
MITIGATING
ACCEPTED
CLOSED
SUPERSEDED
```

## Como citar fontes

Risco identificado só por engenharia: citar SRC-000 ou ED. Risco relatado pelo negócio: SOURCE empresarial.

Não afirmar que o risco **já ocorreu** sem incidente registrado.

## Como registrar incerteza

`Probability: UNKNOWN`. Não criar SLA/RPO numérico para “completar” o risco.

## Como preservar histórico

Incidentes futuros em seção Events. Não apagar risco mitigado; `CLOSED` com evidência.

## Quando bloqueia implementação

Risco `OPEN` classificado como bloqueante no incremento (ex.: autorização indefinida para dado crítico) → DoR falha → `NOT_READY_FOR_IMPLEMENTATION`.
