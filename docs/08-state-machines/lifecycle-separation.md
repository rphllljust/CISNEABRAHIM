# SM-SEP-001

| Campo       | Valor                       |
| ----------- | --------------------------- |
| Document ID | Separação de ciclos de vida |
| Prompt      | 07                          |

## Ciclos modelados separadamente

| Ciclo                 | SM-CAND     | Owner BC | Não implica                         |
| --------------------- | ----------- | -------- | ----------------------------------- |
| SERVICE_REQUEST       | SM-CAND-001 | BC-005   | OS liberada                         |
| SERVICE_ORDER         | SM-CAND-002 | BC-006   | Medição aprovada                    |
| ALLOCATION            | SM-CAND-003 | BC-007   | Execução iniciada                   |
| EXECUTION             | SM-CAND-004 | BC-008   | OS concluída (coordenação via deps) |
| MEASUREMENT           | SM-CAND-005 | BC-010   | Nota emitida                        |
| DOCUMENT              | SM-CAND-006 | BC-014   | OS válida                           |
| BILLING               | SM-CAND-007 | BC-011   | Pagamento recebido                  |
| INVOICE               | SM-CAND-008 | BC-012   | Pagamento                           |
| PAYMENT               | SM-CAND-009 | BC-013   | OS encerrada financeiramente        |
| NOTIFICATION_DELIVERY | SM-CAND-010 | BC-015   | Visualização humana                 |

## O que NÃO é um único `status` da OS

| Conceito              | Onde vive       | Classificação               |
| --------------------- | --------------- | --------------------------- |
| Medição aprovada      | SM-CAND-005     | Ciclo próprio               |
| Faturamento preparado | SM-CAND-007     | Ciclo próprio               |
| Nota registrada       | SM-CAND-008     | Ciclo próprio               |
| Pagamento recebido    | SM-CAND-009     | Ciclo próprio               |
| Documento válido      | SM-CAND-006     | Ciclo próprio               |
| Notificação entregue  | SM-CAND-010     | Ciclo próprio               |
| Visualizada / aceita  | TIMESTAMP/AUDIT | **Não** estado OS (DDP-032) |

## OS concluída (operacional) ≠ encerramento financeiro

Conclusão operacional (SM-CAND-002 ou SM-CAND-004) habilita candidatamente medição — não garante medição, faturamento ou pagamento.

## Documento: três níveis

| Nível             | SM                                    | Notas                                    |
| ----------------- | ------------------------------------- | ---------------------------------------- |
| Documento lógico  | SM-CAND-006 (nível lógico)            | TERM-031                                 |
| Versão documental | Sub-estados em document-state-machine | TERM-032                                 |
| Arquivo binário   | Metadado de versão                    | TERM-033 — não compartilha estado com OS |

## Benefício da separação alocação vs execução

Alocação (SM-CAND-003) pode evoluir (substituída, cancelada) independentemente do progresso de execução (SM-CAND-004) — DBND-003 candidato.
