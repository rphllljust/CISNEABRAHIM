# SM-CAND-004 — EXECUTION

| Campo    | Valor                                                                                        |
| -------- | -------------------------------------------------------------------------------------------- |
| ID       | SM-CAND-004                                                                                  |
| Ciclo    | EXECUTION                                                                                    |
| BC owner | BC-CAND-008                                                                                  |
| Fonte    | SRC-001 (EV-044, EV-045)                                                                     |
| Status   | PARTIALLY_SUPPORTED                                                                          |
| Nota     | Ciclo distinto da OS quando progresso e conclusão operacional precisam rastreio independente |

## Diagrama candidato

```text
[NAO_INICIADA] --iniciar--> [EM_ANDAMENTO] --concluir--> [CONCLUIDA]*
```

Coordenação com SM-CAND-002: iniciar execução alinha OS → EM_EXECUCAO (TR-CAND-009).

## Estados

### STATE-CAND-018 — NAO_INICIADA

| Campo     | Valor                                     |
| --------- | ----------------------------------------- |
| Nome      | Não iniciada                              |
| Definição | Execução ainda não começou para a OS      |
| Entrada   | Criação de registro de execução candidato |
| Saída     | CMD-008                                   |
| Status    | CANDIDATE                                 |

### STATE-CAND-019 — EM_ANDAMENTO

| Campo     | Valor                                          |
| --------- | ---------------------------------------------- |
| Nome      | Em andamento                                   |
| Definição | Trabalho em curso; progresso registrável       |
| Fonte     | EV-044, DE-009, CMD-009                        |
| Operações | Registrar progresso, anexar evidência (BC-009) |
| Status    | CANDIDATE                                      |

### STATE-CAND-020 — CONCLUIDA

| Campo       | Valor                                                |
| ----------- | ---------------------------------------------------- |
| Nome        | Concluída                                            |
| Definição   | Execução operacional finalizada                      |
| Fonte       | EV-045, DE-011                                       |
| Terminal    | Sim (candidato)                                      |
| Não implica | OS CONCLUIDA automaticamente — coordenação explícita |
| Status      | CANDIDATE                                            |

### STATE-CAND-052 — PAUSADA (candidato rejeitado)

| Campo     | Valor                             |
| --------- | --------------------------------- |
| Nome      | Pausada                           |
| Definição | Execução suspensa temporariamente |
| Fonte     | Ausente em SRC-001                |
| Status    | REJECTED — SDD-003                |

## Benefício da separação

Permite registrar progresso (DE-010) e evidências sem reclassificar estado global da OS.

## Transições

TR-CAND-022..024 em [state-transition-register.md](./state-transition-register.md).
