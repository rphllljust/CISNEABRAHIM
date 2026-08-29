# Engineering principles

| Campo       | Valor                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------- |
| Document ID | PRIN-001                                                                                     |
| Source      | SRC-000                                                                                      |
| Note        | Itens abaixo **não** são regras de negócio confirmadas do cliente, salvo indicação explícita |

Legenda de natureza:

- **EP** — princípio de engenharia deste projeto (governança / qualidade).
- **BC** — candidato empresarial (pode tornar-se regra somente com fonte e validação).

Nenhum item **BC** deve ser tratado como `CONFIRMED`.

## Princípios

| ID     | Natureza | Princípio                                                                                                                                                     |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EP-001 | EP       | Negócio antes da tecnologia. Stack e frameworks não definem o domínio.                                                                                        |
| EP-002 | EP       | Regras críticas, quando implementadas, são protegidas no backend. Frontend não é boundary de segurança.                                                       |
| EP-003 | EP       | Autorização é contextual (recurso, ação, estado, vínculo), não apenas “perfil nomeado”. Modelo de permissões empresariais permanece não definido.             |
| EP-004 | EP       | Integridade transacional: efeitos que devem ser atômicos não são parcialmente persistidos como sucesso.                                                       |
| EP-005 | EP       | Concorrência é explícita (estratégia documentada). Não assumir “último write ganha” por omissão.                                                              |
| EP-006 | EP       | Idempotência para operações sensíveis à repetição (rede, duplo clique, reprocessamento).                                                                      |
| EP-007 | EP       | Audit trail é distinto de logs técnicos. Log de aplicação não substitui trilha de auditoria.                                                                  |
| EP-008 | EP       | Histórico de domínio (o que o negócio precisa recordar) é distinto de audit trail (quem fez o quê, para controle).                                            |
| EP-009 | EP       | Documento lógico (identidade de negócio) é distinto de versão e de arquivo binário.                                                                           |
| EP-010 | BC       | Custo interno é diferente de preço comercial. Relação futura exige fonte.                                                                                     |
| EP-011 | BC       | Planejado é diferente de alocado.                                                                                                                             |
| EP-012 | BC       | Alocado é diferente de realizado.                                                                                                                             |
| EP-013 | BC       | Realizado é diferente de medido.                                                                                                                              |
| EP-014 | BC       | Medido é diferente de faturado.                                                                                                                               |
| EP-015 | BC       | Solicitação é diferente de Ordem de Serviço.                                                                                                                  |
| EP-016 | BC       | Pedido do cliente é diferente de Ordem de Serviço.                                                                                                            |
| EP-017 | EP / BC  | Estados são independentes por contexto até prova em contrário. Não unificar máquinas de estado sem evidência. (A existência e os valores dos estados são BC.) |
| EP-018 | EP       | Falhas externas não podem criar sucesso local falso (exemplo: “pago” sem confirmação da fonte de pagamento, quando essa regra for confirmada).                |
| EP-019 | EP       | Migrations futuras devem ser reversíveis ou possuir estratégia segura documentada.                                                                            |
| EP-020 | EP       | Backups futuros precisarão ser restauráveis e testados. Existência de arquivo de backup não prova recuperabilidade.                                           |
| EP-021 | EP       | Observabilidade sem exposição de dados sensíveis (segredos, dados pessoais desnecessários, conteúdo de documentos restritos).                                 |
| EP-022 | EP       | Testes proporcionais ao risco, não à moda da ferramenta.                                                                                                      |
| EP-023 | EP       | Nenhuma otimização prematura.                                                                                                                                 |
| EP-024 | EP       | Nenhum framework controlando o domínio. O modelo de negócio não é o schema do ORM.                                                                            |
| EP-025 | EP       | Nenhuma regra confirmada sem proveniência.                                                                                                                    |

## Uso

Estes princípios orientam ADRs futuros e reviews. Não autorizam inventar estados de OS, cardinalidades, fluxos fiscais ou permissões.

Conflito entre um **EP** e uma regra **CONFIRMED** futura deve ser registrado; a regra empresarial confirmada prevalece no domínio, e a engenharia documenta o impacto.
