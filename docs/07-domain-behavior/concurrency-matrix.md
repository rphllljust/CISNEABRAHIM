# DBEH-CONC-001

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Document ID | Matriz de concorrência |
| Prompt      | 06                     |

| Cenário                               | CMD         | Risco    | Comportamento esperado                      | Mecanismo                   |
| ------------------------------------- | ----------- | -------- | ------------------------------------------- | --------------------------- |
| Duas pessoas editam OS                | CMD-013     | RISK-003 | Detectar conflito; sem lost update          | **Não escolhido** — INV-019 |
| Duas liberações simultâneas           | CMD-005     | RISK-022 | Uma liberação efetiva; segunda REJ ou no-op | EXCLUSIVE                   |
| Duas conversões mesma solicitação     | CMD-003     | RISK-004 | Uma OS; segunda REJ-001                     | DEDUP                       |
| Mesmo ativo alocado                   | CMD-015     | RISK-006 | REJ-005 ou DE-008                           | EXCLUSIVE                   |
| Saldo PO consumido concorrente        | FR-033      | RISK-009 | REJ-011; saldo consistente                  | FINANCIAL_RACE              |
| Medição aprovada e corrigida          | CMD-018     | RISK-013 | Política correção TBD                       | OPTIMISTIC                  |
| Nota registrada duas vezes            | CMD-020     | RISK-004 | REJ-010                                     | IDEMPOTENCY                 |
| Pagamento repetido                    | CMD-021     | RISK-004 | REJ-009                                     | IDEMPOTENCY                 |
| Documento substituído simultaneamente | CMD-022     | RISK-008 | Uma versão vencedora determinística         | OPTIMISTIC                  |
| Concluir e cancelar OS                | CMD-010/011 | RISK-003 | REJ-018                                     | EXCLUSIVE estado            |

Classificação alinhada a [concurrency-and-idempotency-quality.md](../04-quality-attributes/concurrency-and-idempotency-quality.md).
