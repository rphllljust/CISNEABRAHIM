# QATTR-SLO-PENDING-001

| Campo                    | Valor                                                |
| ------------------------ | ---------------------------------------------------- |
| Document ID              | Objetivos de nível de serviço — pendentes de decisão |
| Fonte                    | SRC-001                                              |
| Prompt                   | 03                                                   |
| Invented numeric targets | **0**                                                |

> Lista de métricas que **precisam** de decisão empresarial ou fonte primária. Nenhum valor numérico atribuído nesta etapa.

## Disponibilidade

| Métrica                                      | Operação / escopo            | DDP     | NFR     | Valor-alvo         | Método futuro              |
| -------------------------------------------- | ---------------------------- | ------- | ------- | ------------------ | -------------------------- |
| Disponibilidade operacional                  | Janela de operação relevante | DDP-040 | NFR-023 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Tolerância a indisponibilidade planejada     | Manutenção                   | DDP-040 | —       | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Operações críticas 24/7 vs horário comercial | Liberação, execução, medição | DDP-040 | NFR-023 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |

## Performance e latência

| Métrica                                 | Classe de operação   | DDP     | NFR     | Valor-alvo         | Método futuro              |
| --------------------------------------- | -------------------- | ------- | ------- | ------------------ | -------------------------- |
| Tempo de resposta — leitura interativa  | OP-CLASS-READ        | DDP-036 | NFR-032 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Tempo de resposta — escrita operacional | OP-CLASS-WRITE       | DDP-036 | NFR-032 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Tempo de resposta — workflow            | OP-CLASS-WORKFLOW    | DDP-036 | NFR-032 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Tempo de upload                         | OP-CLASS-UPLOAD      | DDP-017 | NFR-034 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Tempo de integração externa             | OP-CLASS-INTEGRATION | DDP-014 | NFR-035 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Tempo de relatório analítico            | OP-CLASS-REPORT      | DDP-036 | NFR-032 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |

## Capacidade e volume

| Métrica                              | Escopo                     | DDP     | NFR     | Valor-alvo         | Método futuro              |
| ------------------------------------ | -------------------------- | ------- | ------- | ------------------ | -------------------------- |
| Usuários simultâneos                 | Pico operacional           | DDP-017 | NFR-033 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Volume mensal transacional           | OS, solicitações, medições | DDP-017 | —       | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Tamanho máximo de arquivo            | Evidências e documentos    | DDP-017 | NFR-034 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Taxa de erro aceitável em integração | Referências comerciais     | DDP-014 | NFR-035 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |

## Recuperação e continuidade

| Métrica                        | Escopo                          | DDP     | NFR     | Valor-alvo         | Método futuro              |
| ------------------------------ | ------------------------------- | ------- | ------- | ------------------ | -------------------------- |
| RPO                            | Perda máxima aceitável de dados | DDP-016 | NFR-027 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| RTO                            | Tempo máximo de recuperação     | DDP-016 | NFR-028 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Frequência de teste de restore | Continuidade                    | DDP-016 | NFR-026 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Critério de sucesso de restore | Dados empresariais críticos     | DDP-016 | NFR-026 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |

## Segurança e sessão (decisões abertas)

| Métrica                        | Escopo              | DDP     | NFR         | Valor-alvo         | Método futuro              |
| ------------------------------ | ------------------- | ------- | ----------- | ------------------ | -------------------------- |
| Duração de sessão              | Aplicação futura    | DDP-015 | NFR-016     | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Política MFA                   | Autenticação futura | DDP-015 | SEC-REQ-018 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Limite de tentativas de acesso | Prevenção de abuso  | —       | NFR-020     | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |

## Retenção e observabilidade

| Métrica                   | Escopo                | DDP     | NFR     | Valor-alvo         | Método futuro              |
| ------------------------- | --------------------- | ------- | ------- | ------------------ | -------------------------- |
| Retenção de AUDIT_TRAIL   | Histórico empresarial | DDP-019 | NFR-037 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Retenção de TECHNICAL_LOG | Diagnóstico           | DDP-038 | NFR-039 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |
| Retenção de backup        | Recuperação           | DDP-016 | NFR-025 | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |

## Acessibilidade

| Métrica                   | Escopo           | DDP | Valor-alvo         | Método futuro              |
| ------------------------- | ---------------- | --- | ------------------ | -------------------------- |
| Nível WCAG ou equivalente | Interface futura | —   | TARGET_NOT_DEFINED | MEASUREMENT_METHOD_PENDING |

**Total métricas pendentes:** 24 (todas sem valor numérico atribuído)

Questões correlatas: [nfr-open-questions.md](./nfr-open-questions.md) (NFNQ-001..018).
