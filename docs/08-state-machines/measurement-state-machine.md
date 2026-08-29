# SM-CAND-005 — MEASUREMENT

| Campo    | Valor               |
| -------- | ------------------- |
| ID       | SM-CAND-005         |
| Ciclo    | MEASUREMENT         |
| BC owner | BC-CAND-010         |
| Fonte    | SRC-001 (EV-062)    |
| Status   | PARTIALLY_SUPPORTED |
| DDP      | DDP-010             |

## Diagrama candidato

```text
[RASCUNHO] --submeter--> [SUBMETIDA] --analisar--> [EM_ANALISE] --aprovar--> [APROVADA]*
                                    |                    |
                                    |                    +--rejeitar--> [REJEITADA] --corrigir?--> [CORRIGIDA]
                                    +--cancelar?--> [CANCELADA]*
```

## Estados

### STATE-CAND-021 — RASCUNHO

| Campo     | Valor                                |
| --------- | ------------------------------------ |
| Nome      | Rascunho                             |
| Definição | Medição em elaboração, não submetida |
| Status    | CANDIDATE                            |

### STATE-CAND-022 — SUBMETIDA

| Campo     | Valor                        |
| --------- | ---------------------------- |
| Nome      | Submetida                    |
| Definição | Medição enviada para análise |
| Fonte     | CMD-017, DE-014              |
| Status    | CANDIDATE                    |

### STATE-CAND-023 — EM_ANALISE

| Campo     | Valor                                |
| --------- | ------------------------------------ |
| Nome      | Em análise                           |
| Definição | Aguardando ou em processo de decisão |
| Fonte     | CMD-018 (PENDING)                    |
| Status    | PENDING_BUSINESS_DECISION            |

### STATE-CAND-024 — APROVADA

| Campo             | Valor                                              |
| ----------------- | -------------------------------------------------- |
| Nome              | Aprovada                                           |
| Definição         | Medição aceita para faturamento candidato          |
| Fonte             | DE-015 (PENDING)                                   |
| Terminal          | Sim (candidato)                                    |
| Efeito financeiro | Habilita preparação faturamento — não garante nota |
| Status            | PENDING_BUSINESS_DECISION                          |

### STATE-CAND-025 — REJEITADA

| Campo     | Valor                       |
| --------- | --------------------------- |
| Nome      | Rejeitada                   |
| Definição | Medição recusada na análise |
| Terminal  | Não se correção permitida   |
| DDPs      | DDP-010                     |
| Status    | PENDING_SOURCE_VALIDATION   |

### STATE-CAND-026 — CORRIGIDA

| Campo     | Valor                                           |
| --------- | ----------------------------------------------- |
| Nome      | Corrigida                                       |
| Definição | Nova versão ou retorno a rascunho após rejeição |
| Fonte     | Sem evidência direta                            |
| Status    | PENDING_SOURCE_VALIDATION                       |

### STATE-CAND-027 — CANCELADA

| Campo     | Valor                     |
| --------- | ------------------------- |
| Nome      | Cancelada                 |
| Definição | Medição invalidada        |
| Terminal  | Sim (candidato)           |
| DDPs      | DDP-004                   |
| Status    | PENDING_BUSINESS_DECISION |

## Transições

TR-CAND-025..031 em [state-transition-register.md](./state-transition-register.md).
