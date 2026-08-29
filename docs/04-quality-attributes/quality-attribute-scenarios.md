# QATTR-QA-SC-001

| Campo          | Valor                              |
| -------------- | ---------------------------------- |
| Document ID    | Cenários de atributos de qualidade |
| Fonte          | SRC-001                            |
| Total cenários | 28 (QA-SC-001..QA-SC-028)          |
| Prompt         | 03                                 |

> Cenários sem metas numéricas. Mecanismos técnicos (locking, transação) **não** escolhidos.

---

## QA-SC-001 — Concorrência em alteração de OS

| Campo            | Valor                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Source           | SRC-001 / EV-079                                                                                                        |
| Stimulus         | Duas pessoas tentam alterar simultaneamente a mesma informação empresarial relevante da OS                              |
| Environment      | Operação normal; múltiplos atores                                                                                       |
| Artifact         | Ordem de Serviço                                                                                                        |
| Response         | O sistema deverá impedir sobrescrita silenciosa e apresentar resultado determinístico conforme política ainda a definir |
| Response Measure | TARGET_NOT_DEFINED — taxa de lost update em teste futuro                                                                |
| Business Impact  | Perda de decisão autorizada; disputa operacional                                                                        |
| Related NFR      | NFR-001                                                                                                                 |
| Related Risk     | RISK-003                                                                                                                |
| Status           | PENDING_MEASUREMENT                                                                                                     |

## QA-SC-002 — Reenvio de registro de solicitação

| Campo            | Valor                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Source           | SRC-001 / EV-027                                                                      |
| Stimulus         | Mesma intenção de registro de solicitação é reenviada por instabilidade de canal      |
| Environment      | Canal instável                                                                        |
| Artifact         | Solicitação de serviço                                                                |
| Response         | O sistema deverá evitar duplicidade não autorizada ou sinalizar duplicidade candidata |
| Response Measure | TARGET_NOT_DEFINED                                                                    |
| Business Impact  | Solicitações duplicadas; retrabalho                                                   |
| Related NFR      | NFR-002                                                                               |
| Related Risk     | RISK-004                                                                              |
| Status           | PENDING_SOURCE_VALIDATION                                                             |

## QA-SC-003 — Reenvio de conversão solicitação → OS

| Campo            | Valor                                                      |
| ---------------- | ---------------------------------------------------------- |
| Source           | SRC-001 / EV-028                                           |
| Stimulus         | Comando de conversão é executado mais de uma vez           |
| Environment      | Após aprovação candidata                                   |
| Artifact         | Solicitação; OS                                            |
| Response         | O sistema deverá impedir múltiplas OS da mesma solicitação |
| Response Measure | TARGET_NOT_DEFINED                                         |
| Business Impact  | OS duplicadas; cobrança incorreta                          |
| Related NFR      | NFR-003                                                    |
| Related Risk     | RISK-004                                                   |
| Status           | PENDING_SOURCE_VALIDATION                                  |

## QA-SC-004 — Liberação sem elegibilidade

| Campo            | Valor                                                |
| ---------------- | ---------------------------------------------------- |
| Source           | SRC-001 / EV-036                                     |
| Stimulus         | Ator tenta liberar OS em rascunho ou sem autorização |
| Environment      | Preparação incompleta                                |
| Artifact         | Ordem de Serviço                                     |
| Response         | O sistema deverá impedir liberação                   |
| Response Measure | TARGET_NOT_DEFINED — liberações inválidas            |
| Business Impact  | OS não autorizada em campo                           |
| Related NFR      | NFR-004                                              |
| Related Risk     | RISK-022                                             |
| Status           | PENDING_BUSINESS_DECISION                            |

## QA-SC-005 — Alocação concorrente de recurso

| Campo            | Valor                                           |
| ---------------- | ----------------------------------------------- |
| Source           | SRC-001 / EV-053                                |
| Stimulus         | Mesmo recurso alocado a duas OS simultaneamente |
| Environment      | Múltiplas execuções                             |
| Artifact         | Alocação de recurso                             |
| Response         | O sistema deverá sinalizar conflito             |
| Response Measure | TARGET_NOT_DEFINED                              |
| Business Impact  | Dupla alocação; conflito operacional            |
| Related NFR      | NFR-005                                         |
| Related Risk     | RISK-006                                        |
| Status           | PENDING_SOURCE_VALIDATION                       |

## QA-SC-006 — Consulta de histórico após alterações

| Campo            | Valor                                                          |
| ---------------- | -------------------------------------------------------------- |
| Source           | SRC-001 / EV-078                                               |
| Stimulus         | Auditor consulta histórico após série de alterações na OS      |
| Environment      | Pós-operação                                                   |
| Artifact         | Histórico da OS (AUDIT_TRAIL)                                  |
| Response         | O sistema deverá apresentar sequência de alterações relevantes |
| Response Measure | TARGET_NOT_DEFINED — completude do histórico                   |
| Business Impact  | Impossibilidade de auditoria                                   |
| Related NFR      | NFR-006                                                        |
| Related Risk     | RISK-008                                                       |
| Status           | PENDING_SOURCE_VALIDATION                                      |

## QA-SC-007 — Ação sem autorização empresarial

| Campo            | Valor                                                   |
| ---------------- | ------------------------------------------------------- |
| Source           | SRC-001 / EV-033                                        |
| Stimulus         | Ator sem alçada tenta aprovar solicitação ou liberar OS |
| Environment      | Qualquer canal                                          |
| Artifact         | Operação autorizada                                     |
| Response         | O sistema deverá impedir ação                           |
| Response Measure | TARGET_NOT_DEFINED                                      |
| Business Impact  | Violação de governança                                  |
| Related NFR      | NFR-007                                                 |
| Related Risk     | RISK-007, RISK-013                                      |
| Status           | PENDING_BUSINESS_DECISION                               |

## QA-SC-008 — Consulta de custo por não autorizado

| Campo            | Valor                                             |
| ---------------- | ------------------------------------------------- |
| Source           | SRC-001 / EV-061                                  |
| Stimulus         | Executor tenta visualizar custo interno ou margem |
| Environment      | Tela ou relatório                                 |
| Artifact         | Dados restritos                                   |
| Response         | O sistema deverá ocultar ou negar acesso          |
| Response Measure | TARGET_NOT_DEFINED                                |
| Business Impact  | Exposição de margem                               |
| Related NFR      | NFR-008                                           |
| Related Risk     | RISK-020                                          |
| Status           | PENDING_BUSINESS_DECISION                         |

## QA-SC-009 — Substituição documental

| Campo            | Valor                                           |
| ---------------- | ----------------------------------------------- |
| Source           | SRC-001 / EV-082                                |
| Stimulus         | Responsável substitui documento por nova versão |
| Environment      | Gestão documental                               |
| Artifact         | Versões documentais                             |
| Response         | O sistema deverá preservar versão anterior      |
| Response Measure | TARGET_NOT_DEFINED                              |
| Business Impact  | Perda de evidência                              |
| Related NFR      | NFR-009                                         |
| Related Risk     | RISK-008                                        |
| Status           | PENDING_SOURCE_VALIDATION                       |

## QA-SC-010 — Acesso a documento restrito

| Campo            | Valor                                               |
| ---------------- | --------------------------------------------------- |
| Source           | SRC-001 / EV-021                                    |
| Stimulus         | Ator não autorizado tenta baixar documento restrito |
| Environment      | Operação                                            |
| Artifact         | Documento lógico                                    |
| Response         | O sistema deverá negar ou registrar tentativa       |
| Response Measure | TARGET_NOT_DEFINED                                  |
| Business Impact  | Vazamento documental                                |
| Related NFR      | NFR-010                                             |
| Related Risk     | RISK-007                                            |
| Status           | PENDING_BUSINESS_DECISION                           |

## QA-SC-011 — Cobrança sem origem

| Campo            | Valor                                                    |
| ---------------- | -------------------------------------------------------- |
| Source           | SRC-001 / EV-017                                         |
| Stimulus         | Analista prepara item faturável sem origem identificável |
| Environment      | Fluxo de faturamento candidato                           |
| Artifact         | Item faturável                                           |
| Response         | O sistema deverá impedir ou sinalizar ausência de origem |
| Response Measure | TARGET_NOT_DEFINED                                       |
| Business Impact  | Cobrança contestada                                      |
| Related NFR      | NFR-011                                                  |
| Related Risk     | RISK-005                                                 |
| Status           | PENDING_SOURCE_VALIDATION                                |

## QA-SC-012 — ERP indisponível

| Campo            | Valor                                                    |
| ---------------- | -------------------------------------------------------- |
| Source           | SRC-001 / EV-077                                         |
| Stimulus         | Integração com ERP candidato falha durante sincronização |
| Environment      | Integração ativa                                         |
| Artifact         | Referência comercial                                     |
| Response         | O sistema deverá registrar falha sem sucesso falso local |
| Response Measure | TARGET_NOT_DEFINED                                       |
| Business Impact  | Divergência comercial                                    |
| Related NFR      | NFR-012                                                  |
| Related Risk     | RISK-010                                                 |
| Status           | PENDING_SOURCE_VALIDATION                                |

## QA-SC-013 — Mesmo ator prepara e aprova medição

| Campo            | Valor                                         |
| ---------------- | --------------------------------------------- |
| Source           | SRC-001 / EV-062                              |
| Stimulus         | Mesmo ator submete e aprova medição           |
| Environment      | Fluxo de medição                              |
| Artifact         | Medição                                       |
| Response         | O sistema deverá aplicar segregação candidata |
| Response Measure | TARGET_NOT_DEFINED                            |
| Business Impact  | Fraude ou erro não detectado                  |
| Related NFR      | NFR-013, NFR-019                              |
| Related Risk     | RISK-013                                      |
| Status           | PENDING_BUSINESS_DECISION                     |

## QA-SC-014 — Consumo de PO acima do saldo

| Campo            | Valor                                                   |
| ---------------- | ------------------------------------------------------- |
| Source           | SRC-001 / EV-060                                        |
| Stimulus         | Registro de consumo excede saldo candidato de PO        |
| Environment      | Vínculo comercial                                       |
| Artifact         | Saldo de PO                                             |
| Response         | O sistema deverá sinalizar ou bloquear conforme DDP-009 |
| Response Measure | TARGET_NOT_DEFINED                                      |
| Business Impact  | Excedente comercial                                     |
| Related NFR      | NFR-014                                                 |
| Related Risk     | RISK-009                                                |
| Status           | PENDING_BUSINESS_DECISION                               |

## QA-SC-015 — Evidência em contexto errado

| Campo            | Valor                                                |
| ---------------- | ---------------------------------------------------- |
| Source           | SRC-001 / EV-046                                     |
| Stimulus         | Evidência de execução associada a OS incorreta       |
| Environment      | Campo                                                |
| Artifact         | Evidência                                            |
| Response         | O sistema deverá rejeitar vínculo inválido candidato |
| Response Measure | TARGET_NOT_DEFINED                                   |
| Business Impact  | Comprovação inválida                                 |
| Related NFR      | NFR-015                                              |
| Related Risk     | RISK-008                                             |
| Status           | PENDING_SOURCE_VALIDATION                            |

## QA-SC-016 — Upload de arquivo suspeito

| Campo            | Valor                                                          |
| ---------------- | -------------------------------------------------------------- |
| Source           | SRC-001 / EV-030                                               |
| Stimulus         | Upload de arquivo com conteúdo inválido ou malicioso candidato |
| Environment      | Anexo                                                          |
| Artifact         | Arquivo                                                        |
| Response         | O sistema deverá rejeitar ou isolar sem execução               |
| Response Measure | TARGET_NOT_DEFINED                                             |
| Business Impact  | Comprometimento de segurança                                   |
| Related NFR      | NFR-017                                                        |
| Related Risk     | RISK-016                                                       |
| Status           | PENDING_MEASUREMENT                                            |

## QA-SC-017 — Preparador libera própria OS

| Campo            | Valor                                                                |
| ---------------- | -------------------------------------------------------------------- |
| Source           | SRC-001 / EV-039                                                     |
| Stimulus         | Mesmo ator que preparou OS tenta liberá-la                           |
| Environment      | Fluxo de liberação                                                   |
| Artifact         | OS                                                                   |
| Response         | O sistema deverá aplicar segregação candidata preparação ≠ liberação |
| Response Measure | TARGET_NOT_DEFINED                                                   |
| Business Impact  | Controle interno enfraquecido                                        |
| Related NFR      | NFR-019                                                              |
| Related Risk     | RISK-013, RISK-022                                                   |
| Status           | PENDING_BUSINESS_DECISION                                            |

## QA-SC-018 — Exportação de relatório com margem

| Campo            | Valor                                                      |
| ---------------- | ---------------------------------------------------------- |
| Source           | SRC-001 / EV-061                                           |
| Stimulus         | Usuário exporta relatório contendo margem                  |
| Environment      | Relatórios                                                 |
| Artifact         | Exportação                                                 |
| Response         | O sistema deverá exigir autorização e registrar exportação |
| Response Measure | TARGET_NOT_DEFINED                                         |
| Business Impact  | Vazamento de informação comercial                          |
| Related NFR      | NFR-021                                                    |
| Related Risk     | RISK-020                                                   |
| Status           | PENDING_BUSINESS_DECISION                                  |

## QA-SC-019 — Indisponibilidade em horário operacional

| Campo            | Valor                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Source           | SRC-001 / EV-005                                                                                        |
| Stimulus         | Sistema indisponível durante necessidade operacional                                                    |
| Environment      | Horário de operação                                                                                     |
| Artifact         | Serviço                                                                                                 |
| Response         | O sistema deverá comunicar indisponibilidade ou degradar funcionalidades não críticas conforme política |
| Response Measure | TARGET_NOT_DEFINED                                                                                      |
| Business Impact  | Parada operacional                                                                                      |
| Related NFR      | NFR-023                                                                                                 |
| Related Risk     | RISK-002                                                                                                |
| Status           | PENDING_MEASUREMENT                                                                                     |

## QA-SC-020 — Falha parcial de integração

| Campo            | Valor                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Source           | SRC-001 / EV-077                                                         |
| Stimulus         | Subsistema de notificação falha enquanto registro transacional prossegue |
| Environment      | Falha parcial                                                            |
| Artifact         | Operação mista                                                           |
| Response         | Registro empresarial preservado; notificação pendente ou falha explícita |
| Response Measure | TARGET_NOT_DEFINED                                                       |
| Business Impact  | Inconsistência percebida pelo usuário                                    |
| Related NFR      | NFR-024                                                                  |
| Related Risk     | RISK-010                                                                 |
| Status           | PENDING_SOURCE_VALIDATION                                                |

## QA-SC-021 — Restauração após perda de dados

| Campo            | Valor                                         |
| ---------------- | --------------------------------------------- |
| Source           | SRC-001 / EV-083                              |
| Stimulus         | Necessidade de restaurar dados após incidente |
| Environment      | DR                                            |
| Artifact         | Backup                                        |
| Response         | Restauração conforme RPO futuro               |
| Response Measure | TARGET_NOT_DEFINED (RPO: DDP-016)             |
| Business Impact  | Perda irreversível de histórico               |
| Related NFR      | NFR-025, NFR-027                              |
| Related Risk     | RISK-011                                      |
| Status           | PENDING_MEASUREMENT                           |

## QA-SC-022 — Teste de restore

| Campo            | Valor                               |
| ---------------- | ----------------------------------- |
| Source           | SRC-001 / EV-083                    |
| Stimulus         | Equipe executa teste de restauração |
| Environment      | Ambiente isolado                    |
| Artifact         | Backup                              |
| Response         | Restore completo verificável        |
| Response Measure | TARGET_NOT_DEFINED                  |
| Business Impact  | Backup inútil em desastre real      |
| Related NFR      | NFR-026                             |
| Related Risk     | RISK-011                            |
| Status           | PENDING_MEASUREMENT                 |

## QA-SC-023 — Evento de liberação registrado

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| Source           | SRC-001 / EV-036                                   |
| Stimulus         | OS é liberada por autorizador                      |
| Environment      | Operação                                           |
| Artifact         | AUDIT_TRAIL                                        |
| Response         | Evento de liberação registrado com contexto mínimo |
| Response Measure | TARGET_NOT_DEFINED                                 |
| Business Impact  | Impossibilidade de provar quem liberou             |
| Related NFR      | NFR-029                                            |
| Related Risk     | RISK-024                                           |
| Status           | PENDING_SOURCE_VALIDATION                          |

## QA-SC-024 — Rastreamento solicitação → faturamento

| Campo            | Valor                                                             |
| ---------------- | ----------------------------------------------------------------- |
| Source           | SRC-001 / EV-005                                                  |
| Stimulus         | Auditor reconstrói cadeia de uma cobrança contestada              |
| Environment      | Investigação                                                      |
| Artifact         | Cadeia transacional                                               |
| Response         | Correlação entre solicitação, OS, medição e faturamento candidato |
| Response Measure | TARGET_NOT_DEFINED — tempo de reconstrução                        |
| Business Impact  | Disputa comercial prolongada                                      |
| Related NFR      | NFR-030                                                           |
| Related Risk     | RISK-005                                                          |
| Status           | PENDING_MEASUREMENT                                               |

## QA-SC-025 — Alerta de divergência comercial

| Campo            | Valor                                                 |
| ---------------- | ----------------------------------------------------- |
| Source           | SRC-001 / EV-023                                      |
| Stimulus         | Divergência comercial identificada                    |
| Environment      | Operação                                              |
| Artifact         | ALERT                                                 |
| Response         | Responsável candidato notificado ou evento registrado |
| Response Measure | TARGET_NOT_DEFINED                                    |
| Business Impact  | Divergência não tratada                               |
| Related NFR      | NFR-031                                               |
| Related Risk     | RISK-009                                              |
| Status           | PENDING_MEASUREMENT                                   |

## QA-SC-026 — Relatório sob carga

| Campo            | Valor                                                        |
| ---------------- | ------------------------------------------------------------ |
| Source           | SRC-001 / EV-075                                             |
| Stimulus         | Múltiplos usuários executam relatórios simultaneamente       |
| Environment      | Pico                                                         |
| Artifact         | Consultas analíticas                                         |
| Response         | Tempo de resposta mensurável; degradação aceitável a definir |
| Response Measure | TARGET_NOT_DEFINED                                           |
| Business Impact  | Lentidão operacional                                         |
| Related NFR      | NFR-032                                                      |
| Related Risk     | RISK-002                                                     |
| Status           | PENDING_MEASUREMENT                                          |

## QA-SC-027 — Log técnico com dado pessoal

| Campo            | Valor                                                             |
| ---------------- | ----------------------------------------------------------------- |
| Source           | SRC-001 / EV-029                                                  |
| Stimulus         | Erro técnico registrado contendo identificador pessoal            |
| Environment      | Operação                                                          |
| Artifact         | TECHNICAL_LOG                                                     |
| Response         | Redação ou exclusão de PII desnecessária conforme política futura |
| Response Measure | TARGET_NOT_DEFINED                                                |
| Business Impact  | Exposição de dados pessoais                                       |
| Related NFR      | NFR-039                                                           |
| Related Risk     | RISK-024                                                          |
| Status           | PENDING_LEGAL_VALIDATION                                          |

## QA-SC-028 — Migração de versão

| Campo            | Valor                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Source           | SRC-001 / EV-078                                                          |
| Stimulus         | Nova versão do sistema implantada com mudança de modelo                   |
| Environment      | Evolução                                                                  |
| Artifact         | Histórico empresarial                                                     |
| Response         | Histórico pré-existente permanece consultável ou migrado documentadamente |
| Response Measure | TARGET_NOT_DEFINED                                                        |
| Business Impact  | Perda de auditoria histórica                                              |
| Related NFR      | NFR-040                                                                   |
| Related Risk     | RISK-014                                                                  |
| Status           | PENDING_SOURCE_VALIDATION                                                 |
