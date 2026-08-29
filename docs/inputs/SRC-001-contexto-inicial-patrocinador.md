# SRC-001 — Contexto Inicial Informado pelo Patrocinador

## 1. Identificação da fonte

| Campo                                         | Valor                                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Source ID                                     | SRC-001                                                                                  |
| Título                                        | Contexto inicial informado pelo patrocinador                                             |
| Tipo                                          | Declaração inicial consolidada                                                           |
| Origem                                        | Informações apresentadas pelo responsável pelo projeto durante o levantamento preliminar |
| Empresa relacionada                           | Cisne Rondônia                                                                           |
| Localidade                                    | Porto Velho, Rondônia                                                                    |
| Data de consolidação                          | 2026-08-28                                                                               |
| Confiabilidade                                | Média                                                                                    |
| Situação                                      | PENDING_BUSINESS_VALIDATION                                                              |
| Pode confirmar regra definitiva isoladamente? | Não                                                                                      |
| Precisa ser confrontada com documentos reais? | Sim                                                                                      |

## 2. Advertência sobre a fonte

Este documento consolida informações preliminares apresentadas pelo responsável pelo projeto.

Ele não substitui:

* Documento Mestre;
* transcrição original das conversas;
* proposta comercial;
* contrato;
* Purchase Order;
* nota ou fatura;
* documentação fiscal;
* documentação contábil;
* documentação do ERP;
* confirmação formal da direção da empresa.

As afirmações deste documento devem ser classificadas individualmente nos próximos levantamentos.

Nenhuma informação deverá ser transformada automaticamente em regra empresarial definitiva apenas porque aparece neste documento.

## 3. Contexto empresarial informado

A Cisne Rondônia é descrita como uma empresa privada sediada em Porto Velho, Rondônia.

Entre as atividades empresariais mencionadas estão:

* representação comercial;
* prestação de serviços logísticos;
* transporte rodoviário municipal de cargas;
* transporte rodoviário intermunicipal de cargas;
* transporte rodoviário interestadual de cargas;
* transporte rodoviário internacional de cargas;
* transporte coletivo de passageiros por fretamento;
* aluguel de automóveis;
* aluguel de máquinas e equipamentos comerciais;
* aluguel de máquinas e equipamentos industriais;
* aluguel de máquinas e equipamentos para construção sem operador;
* prestação de serviços envolvendo veículos, máquinas, equipamentos e mão de obra.

A existência dessas atividades não significa que todas deverão fazer parte do primeiro release.

A prioridade inicial precisa ser formalmente confirmada pela direção.

## 4. Problema operacional preliminar

Foi identificada a necessidade de controlar o serviço desde sua solicitação até sua conclusão e seus possíveis efeitos comerciais e financeiros.

O sistema deverá ser estudado para reduzir situações como:

* solicitação recebida sem controle formal;
* Ordem de Serviço aberta sem autorização;
* dificuldade para identificar quem recebeu determinada responsabilidade;
* falta de informação sobre quando uma OS foi visualizada;
* falta de informação sobre quanto tempo um processo ficou parado;
* ausência de ligação entre serviço executado e cobrança;
* mão de obra registrada somente em observações;
* equipamento utilizado sem registro estruturado;
* dificuldade para separar custo da empresa e preço cobrado;
* documentos alterados por pessoas não autorizadas;
* perda de versão anterior de documento;
* cobrança de item não reconhecido pelo cliente;
* divergência entre pedido, PO, execução, medição e nota;
* dificuldade para identificar gargalos e valores ainda não recebidos.

Esses problemas são candidatos de investigação. Sua ocorrência e frequência precisam ser confirmadas por entrevistas e documentos.

## 5. Solicitação de serviço

O processo atual relatado indica que uma pessoa pode entrar em contato, inclusive por WhatsApp, informando que precisa de um serviço ou da abertura de uma OS.

A solicitação recebida não deve ser tratada automaticamente como uma Ordem de Serviço oficial.

Pontos que precisam ser confirmados:

* quem pode solicitar;
* se o solicitante é interno ou externo;
* quais canais são aceitos;
* quem recebe a solicitação;
* quais informações são obrigatórias;
* se existem anexos;
* se há aprovação;
* se pode haver rejeição;
* se existe motivo obrigatório de rejeição;
* se o solicitante acompanha o andamento;
* se WhatsApp continuará sendo canal oficial;
* se o sistema substituirá ou apenas registrará a conversa do WhatsApp.

## 6. Controle de abertura e liberação da OS

Foi manifestada preocupação para que usuários operacionais não tenham liberdade irrestrita para abrir e liberar Ordens de Serviço.

O entendimento preliminar é:

* o executor pode informar que precisa de uma OS;
* a solicitação será analisada por pessoa autorizada;
* a OS oficial será aberta ou liberada somente mediante decisão autorizada;
* o executor receberá a OS depois da liberação;
* solicitar não equivale a autorizar;
* criar rascunho não deve ser confundido com liberar a execução.

Precisam ser confirmados:

* quem pode criar o rascunho;
* quem pode editar;
* quem pode liberar;
* se criar e liberar podem ser realizados pela mesma pessoa;
* quais condições tornam a OS pronta para liberação;
* se existe recusa;
* se existe cancelamento;
* se existe reabertura;
* se uma OS concluída pode receber novos itens.

## 7. Conteúdo operacional da OS

O sistema deverá ser estudado para permitir que a OS represente o serviço efetivamente planejado ou autorizado pela Cisne.

Entre as informações operacionais citadas ou necessárias para validação estão:

* cliente;
* local do serviço;
* descrição;
* período;
* equipamentos necessários;
* quantidade de equipamentos;
* veículos;
* tipo de mão de obra;
* ajudantes;
* motoristas;
* operadores;
* responsáveis;
* materiais;
* deslocamentos;
* diárias;
* horas;
* horas extras;
* custos;
* preços;
* documentos;
* evidências;
* observações operacionais.

Não está confirmado que todos esses campos sejam obrigatórios para todos os tipos de serviço.

## 8. Equipamentos, veículos e máquinas

Foi relatada a necessidade de informar quais máquinas ou equipamentos serão necessários e suas quantidades.

Devem ser diferenciados:

* tipo de equipamento;
* equipamento físico específico;
* veículo;
* categoria operacional;
* quantidade planejada;
* quantidade alocada;
* quantidade efetivamente utilizada.

Precisam ser confirmadas as necessidades de:

* placa;
* prefixo;
* chassi;
* RENAVAM;
* quilometragem;
* horímetro;
* disponibilidade;
* localização;
* manutenção;
* reserva;
* substituição de equipamento.

Não deverá ser criado cadastro patrimonial completo sem validação.

## 9. Mão de obra

Foram mencionados tipos de mão de obra como:

* ajudante;
* motorista;
* operador;
* supervisor;
* outros profissionais relacionados ao serviço.

O levantamento futuro deverá diferenciar:

```text
TIPO DE MÃO DE OBRA
```

de:

```text
PESSOA EXECUTORA
```

Um serviço pode ser inicialmente planejado com determinada quantidade ou tipo de mão de obra sem que a pessoa executora já esteja escolhida.

Essa possibilidade precisa ser confirmada.

Também precisam ser definidas:

* unidades de cobrança;
* hora;
* diária;
* turno;
* presença;
* substituição;
* apontamento;
* hora extra;
* inclusão no preço global;
* cobrança separada;
* autorização de mão de obra adicional.

## 10. Custos e preços

Foi relatada a necessidade de o responsável visualizar:

* quais recursos serão usados;
* qual será o custo da empresa;
* qual será o valor cobrado do cliente.

Devem permanecer conceitualmente separados:

```text
CUSTO INTERNO
```

e:

```text
PREÇO COMERCIAL
```

Não está definido:

* quem pode visualizar custo;
* quem pode visualizar margem;
* quem pode alterar preço;
* quando o preço pode ser alterado;
* como funcionam descontos;
* como funcionam adicionais;
* se o preço é global, por item ou híbrido;
* como alterações depois da liberação serão autorizadas.

## 11. Regra econômica preliminar

Existe uma necessidade empresarial preliminar de que tudo que possa gerar cobrança tenha origem identificável.

A origem poderá estar relacionada, conforme o caso, a:

* proposta;
* contrato;
* pedido do cliente;
* Purchase Order;
* item da OS;
* recurso planejado;
* recurso autorizado;
* recurso executado;
* evidência;
* medição;
* ajuste aprovado.

Não está confirmado que todos esses passos sejam obrigatórios em todos os serviços.

O próximo levantamento deverá distinguir:

```text
ITEM_PLANNED
ITEM_AUTHORIZED
ITEM_ALLOCATED
ITEM_EXECUTED
ITEM_EVIDENCED
ITEM_MEASURED
ITEM_BILLED
ITEM_PAID
```

Não criar ainda uma única propriedade genérica chamada `quantity` para representar todas essas fases.

## 12. Cadeia comercial preliminar

Foram mencionados ou identificados como possíveis conceitos:

* proposta;
* pedido do cliente;
* Purchase Order;
* contrato;
* solicitação de serviço;
* Ordem de Serviço;
* execução;
* medição;
* faturamento;
* nota/fatura;
* pagamento.

A relação e a cardinalidade entre esses conceitos ainda não estão confirmadas.

É proibido presumir antecipadamente:

* que toda proposta gera PO;
* que todo PO gera OS;
* que um PO gera necessariamente várias OS;
* que uma OS utiliza apenas um PO;
* que toda OS produz medição;
* que toda medição gera uma única nota;
* que toda nota é emitida pelo Sistema Cisne.

## 13. Purchase Order

Foi mencionada a existência de Purchase Orders ou Pedidos de Compra relacionados a clientes.

O sistema poderá precisar preservar:

* número do PO;
* número de requisição;
* cliente/comprador;
* fornecedor;
* datas;
* itens;
* códigos externos;
* quantidades;
* unidades;
* preços;
* valores;
* condições de pagamento;
* local;
* gestor;
* requisitos de faturamento;
* saldo autorizado.

Entretanto, as regras de um PO específico não deverão ser transformadas automaticamente em regras globais.

## 14. Medição e faturamento

O processo de medição ainda precisa ser levantado.

Devem ser respondidas questões como:

* o que pode ser medido;
* quem prepara;
* quem submete;
* quem aprova;
* quem rejeita;
* como corrigir;
* quais evidências são necessárias;
* se há medição parcial;
* se há medição mensal;
* se há medição por OS;
* se o cliente participa da aprovação;
* o que torna um item faturável;
* como divergências são tratadas.

Medição, faturamento, nota e pagamento não devem ser tratados automaticamente como um único estado.

## 15. Nota, fatura e obrigações fiscais

Foi demonstrado interesse em produzir ou controlar digitalmente nota/fatura.

Ainda não está confirmado se o Sistema Cisne:

* emitirá documento fiscal oficial;
* apenas registrará documento emitido externamente;
* integrará com ERP;
* integrará com sistema municipal;
* produzirá somente fatura/recibo não fiscal;
* controlará envio, recebimento e pagamento.

Nenhum requisito fiscal deverá ser implementado sem validação do responsável fiscal, contabilidade, documentação técnica e legislação aplicável.

## 16. Documentos e segurança

Foi expressada preocupação com muitas pessoas alterando documentos.

Foi relatado preliminarmente que apenas pessoas específicas da gestão deveriam controlar determinados documentos.

Os nomes e as permissões definitivas ainda precisam ser formalizados.

O levantamento deverá identificar:

* tipos de documentos;
* documentos críticos;
* quem visualiza;
* quem adiciona;
* quem substitui;
* quem aprova;
* quem pode baixar;
* validade;
* vencimento;
* alertas;
* protocolo;
* versão;
* comprovante;
* retenção.

Devem permanecer distintos:

```text
DOCUMENTO LÓGICO
VERSÃO DOCUMENTAL
ARQUIVO BINÁRIO
STATUS DOCUMENTAL
RESPONSÁVEL
```

Substituição não deverá apagar silenciosamente a versão anterior quando o histórico for empresarialmente necessário.

## 17. Responsabilidade e handoff

Foi identificada preocupação em saber:

* quem recebeu;
* quando recebeu;
* quando visualizou;
* quando movimentou;
* quanto tempo permaneceu parado;
* quem é o responsável atual;
* qual o motivo da pendência.

Os termos abaixo ainda não são estados confirmados:

```text
ASSIGNED
DELIVERED
AVAILABLE
VIEWED
ACKNOWLEDGED
ACCEPTED
PROCESSED
RETURNED
```

Alguns poderão ser:

* eventos;
* timestamps;
* auditoria;
* métricas;
* estados de domínio.

Essa classificação será feita posteriormente.

## 18. Gargalos e aging

O sistema poderá precisar identificar:

* solicitação parada;
* OS parada;
* execução interrompida;
* medição sem processamento;
* nota sem envio;
* nota sem confirmação;
* pagamento atrasado;
* responsável atual;
* motivo da pendência;
* tempo em cada etapa;
* valor financeiro preso.

Não existem faixas de aging confirmadas.

Não criar arbitrariamente intervalos como 0–7, 8–15 ou 16–30 dias.

## 19. Integrações candidatas

Foram mencionadas como possibilidades futuras:

* ERP corporativo;
* sistema fiscal;
* rastreamento veicular;
* WhatsApp;
* e-mail;
* armazenamento de documentos;
* serviços de backup.

Nenhuma integração possui contrato técnico confirmado nesta fonte.

Não escolher APIs, fornecedores ou mecanismos de sincronização sem documentação.

## 20. Regras de segurança preliminares

O projeto deverá investigar e validar:

* segregação de funções;
* acesso por necessidade;
* restrição de custos e margens;
* proteção de documentos;
* histórico empresarial;
* audit trail;
* controle de concorrência;
* prevenção de duplicidade;
* idempotência;
* integridade de integrações;
* backup restaurável;
* recuperação;
* rastreabilidade de alterações.

Esses itens representam preocupações de engenharia e candidatos empresariais. Ainda deverão ser ligados a fontes e regras específicas.

## 21. Prioridade e escopo

A vertical de locação aparece como prioridade econômica candidata.

O núcleo deverá ser estudado para não impedir expansão futura a outras operações.

Isso não autoriza:

* implementar todas as verticais;
* criar abstrações genéricas prematuramente;
* aumentar o primeiro release;
* incluir módulos sem decisão da direção.

## 22. Decisões bloqueantes

Permanecem abertas pelo menos:

1. tipos de serviço e OS;
2. fluxo atual e desejado;
3. responsáveis por cada etapa;
4. processo de liberação;
5. cancelamento e reabertura;
6. composição da OS;
7. mão de obra;
8. equipamentos e veículos;
9. adicionais;
10. custo, preço e margem;
11. cardinalidade de PO;
12. consumo e saldo de PO;
13. medição;
14. faturamento;
15. documento fiscal;
16. pagamento;
17. Source of Truth;
18. documentos críticos;
19. integrações;
20. volume;
21. usuários simultâneos;
22. operação offline;
23. PWA;
24. retenção;
25. RPO;
26. RTO;
27. escopo do primeiro release.

## 23. Regra de utilização desta fonte

O Prompt 01 deverá:

* decompor este documento em evidências atômicas;
* diferenciar fatos de desejos;
* diferenciar processo atual de processo futuro;
* diferenciar regra empresarial de interpretação técnica;
* manter incertezas visíveis;
* criar decisões pendentes quando necessário;
* não tratar o documento como prova fiscal;
* não tratar exemplos como regras globais;
* solicitar as fontes originais sempre que necessário.
