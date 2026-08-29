# DBEH-PRED-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Catálogo de predicados empresariais |
| Total       | 12 (PRED-001..PRED-012)             |
| Prompt      | 06                                  |

| ID       | Predicado                           | Fatos necessários                                                               | DDPs             | CMD             |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------- | ---------------- | --------------- |
| PRED-001 | OS elegível para liberação          | Conteúdo preparado candidato; autorização; PO/condições comerciais se aplicável | DDP-003, DDP-009 | CMD-005         |
| PRED-002 | Recurso disponível para alocação    | Recurso cadastrado; sem alocação exclusiva conflitante; item planejado existe   | DDP-007          | CMD-015         |
| PRED-003 | Solicitação elegível para conversão | Solicitação registrada; decisão favorável candidata; sem OS existente           | DDP-002          | CMD-003         |
| PRED-004 | OS elegível para execução           | OS liberada; responsável atribuído candidato                                    | DDP-003          | CMD-008         |
| PRED-005 | Execução elegível para medição      | Quantidade realizada registrada; OS em estado executável                        | DDP-010          | CMD-017         |
| PRED-006 | Medição elegível para faturamento   | Medição decidida favoravelmente candidata                                       | DDP-010, DDP-011 | CMD-019         |
| PRED-007 | Ator autorizado a ver custo/margem  | Papel empresarial; escopo OS                                                    | DDP-030          | consulta        |
| PRED-008 | PO com saldo suficiente             | Saldo PO; consumo acumulado                                                     | DDP-009          | CMD-005, FR-033 |
| PRED-009 | Documento substituível              | Documento lógico existe; ator autorizado                                        | DDP-013          | CMD-022         |
| PRED-010 | OS elegível para cancelamento       | Estado permite cancelamento; alçada                                             | DDP-004          | CMD-011         |
| PRED-011 | OS elegível para reabertura         | Política reabertura definida                                                    | DDP-005          | CMD-012         |
| PRED-012 | Pagamento registrável               | Nota/obrigação existe; SoT definido                                             | DDP-012          | CMD-021         |

Predicados são **consultas de fatos** — não comandos. Implementação futura pode ser specification pattern; não decidido aqui.
