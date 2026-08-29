# SM-CAND-007 — BILLING

| Campo    | Valor                    |
| -------- | ------------------------ |
| ID       | SM-CAND-007              |
| Ciclo    | BILLING                  |
| BC owner | BC-CAND-011              |
| Fonte    | SRC-001 (EV-064 parcial) |
| Status   | PARTIALLY_SUPPORTED      |

## Diagrama candidato

```text
[NAO_PREPARADO] --preparar--> [PREPARADO] --bloquear?--> [BLOQUEADO] --liberar--> [LIBERADO]*
                     ^                                    |
                     +------------------------------------+
```

## Estados

### STATE-CAND-032 — NAO_PREPARADO

| Campo                 | Valor                                               |
| --------------------- | --------------------------------------------------- |
| Nome                  | Não preparado                                       |
| Definição             | Faturamento ainda não estruturado para a OS/medição |
| Entrada               | Estado inicial ou reset candidato                   |
| Pré-condição preparar | Medição aprovada candidata (XLC-003)                |
| Status                | CANDIDATE                                           |

### STATE-CAND-033 — PREPARADO

| Campo             | Valor                                        |
| ----------------- | -------------------------------------------- |
| Nome              | Preparado                                    |
| Definição         | Dados de faturamento candidatos consolidados |
| Fonte             | CMD-019, DE-016                              |
| Efeito financeiro | CRITICAL candidato                           |
| Status            | CANDIDATE                                    |

### STATE-CAND-034 — BLOQUEADO

| Campo     | Valor                                     |
| --------- | ----------------------------------------- |
| Nome      | Bloqueado                                 |
| Definição | Faturamento impedido por regra ou decisão |
| Fonte     | Sem evidência direta — política candidata |
| Status    | PENDING_SOURCE_VALIDATION                 |

### STATE-CAND-035 — LIBERADO

| Campo       | Valor                                      |
| ----------- | ------------------------------------------ |
| Nome        | Liberado                                   |
| Definição   | Autorizado registrar nota/documento fiscal |
| Terminal    | Sim (candidato para este ciclo)            |
| Não implica | Nota emitida ou pagamento                  |
| Status      | PENDING_BUSINESS_DECISION                  |

## Separação financeira

Estados de BILLING **não** alteram estado da OS (INV-012).

## Transições

TR-CAND-036..039 em [state-transition-register.md](./state-transition-register.md).
