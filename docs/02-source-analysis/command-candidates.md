# Candidatos a comandos

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Document ID | CMD-001                                                       |
| Prompt      | 01                                                            |
| Status      | CANDIDATE / DO_NOT_PROMOTE — nenhum promovido a implementação |

Avaliação preliminar. Nomes em inglês são candidatos de linguagem ubíqua futura, não API.

| Comando candidato          | Evidência      | Intenção empresarial                              | Ator provável                   | Status         | Notas                                            |
| -------------------------- | -------------- | ------------------------------------------------- | ------------------------------- | -------------- | ------------------------------------------------ |
| SubmitServiceRequest       | EV-027, EV-028 | Registrar solicitação recebida                    | Desconhecido                    | CANDIDATE      | Canal, campos e validação TBD (DDP-002, DDP-021) |
| ApproveServiceRequest      | EV-034         | Aprovar solicitação                               | Desconhecido                    | DO_NOT_PROMOTE | Aprovação não confirmada                         |
| RejectServiceRequest       | EV-034         | Rejeitar solicitação com motivo                   | Desconhecido                    | DO_NOT_PROMOTE | Rejeição e motivo obrigatório TBD                |
| ConvertServiceRequest      | EV-028, EV-040 | Converter solicitação em OS (rascunho ou oficial) | Desconhecido                    | DO_NOT_PROMOTE | Cardinalidade e momento TBD                      |
| PrepareServiceOrder        | EV-042, EV-046 | Preparar/planejar conteúdo da OS                  | Desconhecido                    | CANDIDATE      | Distinto de liberar (BR-007)                     |
| ReleaseServiceOrder        | EV-039, EV-040 | Liberar OS para execução                          | Pessoa autorizada (não nomeada) | CANDIDATE      | DDP-003, DDP-022                                 |
| AssignServiceOrder         | EV-071, EV-072 | Atribuir responsabilidade/handoff                 | Desconhecido                    | DO_NOT_PROMOTE | Estados handoff TBD                              |
| AcknowledgeServiceOrder    | EV-084         | Confirmar recebimento/visualização                | Executor                        | DO_NOT_PROMOTE | ACKNOWLEDGED não confirmado como comando         |
| StartServiceOrder          | EV-063         | Iniciar execução                                  | Executor                        | DO_NOT_PROMOTE | Processo execução não detalhado                  |
| PauseServiceOrder          | —              | Pausar execução                                   | Desconhecido                    | DO_NOT_PROMOTE | Não citado em SRC-001                            |
| ResumeServiceOrder         | —              | Retomar execução                                  | Desconhecido                    | DO_NOT_PROMOTE | Não citado em SRC-001                            |
| CompleteServiceOrder       | EV-063         | Concluir OS                                       | Desconhecido                    | DO_NOT_PROMOTE | Efeitos financeiros TBD                          |
| CancelServiceOrder         | SRC-001 §6     | Cancelar OS                                       | Desconhecido                    | DO_NOT_PROMOTE | DDP-004                                          |
| ReopenServiceOrder         | SRC-001 §6     | Reabrir OS concluída                              | Desconhecido                    | DO_NOT_PROMOTE | DDP-005                                          |
| AddExecutionEvidence       | EV-063         | Anexar evidência de execução                      | Desconhecido                    | CANDIDATE      | Tipos de evidência TBD                           |
| RegisterAdditionalResource | EV-062, EV-063 | Registrar recurso adicional não planejado         | Desconhecido                    | DO_NOT_PROMOTE | Autorização adicional TBD                        |
| SubmitMeasurement          | EV-062         | Submeter medição                                  | Desconhecido                    | DO_NOT_PROMOTE | Processo medição não levantado (DDP-010)         |
| ApproveMeasurement         | EV-062         | Aprovar medição                                   | Desconhecido                    | DO_NOT_PROMOTE | DDP-010                                          |
| RejectMeasurement          | EV-062         | Rejeitar medição                                  | Desconhecido                    | DO_NOT_PROMOTE | DDP-010                                          |
| CorrectMeasurement         | EV-062         | Corrigir medição rejeitada                        | Desconhecido                    | DO_NOT_PROMOTE | DDP-010                                          |
| PrepareBilling             | EV-063         | Preparar faturamento                              | Desconhecido                    | DO_NOT_PROMOTE | DDP-011                                          |
| RegisterInvoice            | EV-064, EV-065 | Registrar ou emitir nota/fatura                   | Desconhecido                    | DO_NOT_PROMOTE | Modo fiscal TBD (DDP-023)                        |
| RegisterInvoiceReceipt     | EV-065         | Registrar recebimento/envio de nota               | Desconhecido                    | DO_NOT_PROMOTE | DDP-023                                          |
| RegisterPayment            | EV-063         | Registrar pagamento                               | Desconhecido                    | DO_NOT_PROMOTE | DDP-012                                          |

## Classificações de engenharia (preliminares, amostra)

| Comando              | Repetição                 | Concorrência         | Auditoria |
| -------------------- | ------------------------- | -------------------- | --------- |
| SubmitServiceRequest | IDEMPOTENCY_REQUIRED      | LOW                  | STANDARD  |
| ReleaseServiceOrder  | UNIQUE_BUSINESS_OPERATION | FINANCIAL_RACE       | SENSITIVE |
| RegisterPayment      | IDEMPOTENCY_REQUIRED      | FINANCIAL_RACE       | FINANCIAL |
| RegisterInvoice      | UNIQUE_BUSINESS_OPERATION | STRONG_TRANSACTIONAL | FINANCIAL |

## Legenda

| Status         | Significado                                      |
| -------------- | ------------------------------------------------ |
| CANDIDATE      | Suporte parcial; evoluir após DDP/fonte primária |
| DO_NOT_PROMOTE | Suporte insuficiente ou tema ausente na fonte    |

Total de comandos avaliados: **24** (lista do Prompt 01).
