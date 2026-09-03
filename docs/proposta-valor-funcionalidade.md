# SISTEMA CISNE RONDÔNIA — Funcionalidade real e justificativa de investimento

| Campo | Conteúdo |
| ----- | -------- |
| Público | Decisão comercial / patrocínio (sem valores monetários) |
| Natureza | Descrição do **produto implementado** na API e na web, mais o efeito operacional esperado |
| Não é | Planilha de preço, proposta fiscal, ERP, contrato de go-live |
| Classificação | Interpretação de engenharia do código em `apps/api` e `apps/web`. Problemas do dia a dia citados abaixo vêm do relato empresarial (SRC-001) e **não** são volumes medidos em campo. |
| Data | 2026-08-31 |
| Produção | O sistema **não** está em operação de produção. O investimento descrito é o da vertical operacional já construída e em validação (piloto). |

Este texto **não cita preços, honorários, mensalidades nem faixas de investimento**. O objetivo é mostrar **o que existe de verdade**, **por que isso não é um cadastro simples**, e **onde o tempo, o custo operacional e a rapidez** se recuperam — ou se perdem se a operação continuar em conversa, planilha e memória.

---

## 1. Em uma frase

O Cisne Rondônia é um sistema de **gestão operacional de serviços**: da demanda do cliente até a evidência de execução, a medição e o documento de faturamento — com **quem pode fazer o quê**, **histórico** e **versão** em cada passo crítico.

Não substitui contabilidade, emissão fiscal de nota em ERP, rastreamento de frota ao vivo nem WhatsApp como canal de conversa. Substitui o buraco entre “o cliente pediu” e “alguém cobrou sem ninguém conseguir provar o que foi feito”.

---

## 2. O que se paga (e o que não se paga)

### O que o investimento cobre de fato

Não é uma tela de lista. É uma **cadeia fechada** já implementada:

1. Identidade (login, sessão, saída, renovação de sessão).
2. Permissão no **servidor** (o menu some; a API também recusa).
3. Cadastros operacionais: clientes, pessoas, catálogo de serviços, ativos físicos.
4. Comercial: solicitações, propostas com versões, pedidos de compra (PO).
5. Operação: ordem de serviço, planejamento e alocação de recursos, execução em campo (quantidade, km, horímetro, ocorrência, evidência).
6. Financeiro operacional: medição com revisão, registro de faturamento, documento (incluindo PDF), cancelamento e substituição.
7. Visão: painel, alertas, pesquisa, relatórios exportáveis, aging e produtividade.
8. Proteção: auditoria de segurança, documentos versionados, concorrência (duas pessoas não sobrescrevem a mesma OS sem o sistema perceber), notificações com tentativa e canal, integração externa **desligada até haver confirmação** (não inventa sync com ERP).

### O que isso **não** é

- CRM de marketing.
- Folha / ponto / eSocial.
- Emissor de NF-e no lugar do ERP.
- App de GPS da frota.
- “Pronto para produção” só porque as telas existem. Go-live continua condicionado a piloto e autorização.

O preço de um sistema desses, quando existe, costuma ser comparado com **planilha + grupo de WhatsApp**. A comparação justa é com **o custo de OS sem autorização, serviço sem cobrança, cobrança sem prova, documento errado e atraso invisível**.

---

## 3. Problemas relatados que o sistema ataca

Relato do contexto empresarial (não medido aqui como estatística). Cada linha abaixo tem funcionalidade correspondente **já no código**.

| Situação relatada | O que o sistema faz no lugar |
| ----------------- | ---------------------------- |
| Pedido chega e vira “OS” na hora, sem formalizar | Solicitação tem ciclo próprio: rascunho, envio, revisão, aprovação ou rejeição; **só então** conversão em OS |
| OS aberta sem autorização | Transições de OS (preparar, liberar, cancelar) e conversão exigem ator autenticado e permissão; não é um botão solto no navegador |
| Ninguém sabe quanto tempo a demanda ficou parada | Status, painel, aging, OS vencidas, alertas e relatórios de atraso |
| Serviço feito e cobrança desligada | Medição nasce da OS; faturamento prepara a partir da OS; documento de faturamento é entidade própria, com PDF |
| Mão de obra e equipamento só em observação de texto | Planejamento de recursos, alocação, tipos de mão de obra e ativos físicos cadastrados |
| Custo e preço misturados na cabeça | Catálogo versionado, modelos de preço e de medição, proposta em versões, medição item a item |
| Documento alterado por quem não deveria; versão perdida | Upload com versões, histórico, download controlado, vínculo a solicitação/proposta/PO |
| Cliente não reconhece a cobrança | Evidências na execução, medição aprovada/rejeitada, documento emitido, trilha de quem fez o quê |
| Pedido, PO, execução, medição e nota não batem | Encadeamento no mesmo sistema; PO com registro/cancelamento; faturamento anulável; documento substituível |
| Gargalo e o que não entrou difícil de ver | Painel operacional e executivo, alertas, aging financeiro, pesquisa única |

---

## 4. A cadeia de ponta a ponta (fluxo real)

Não é obrigatório usar **todas** as etapas em todo serviço. O sistema **permite** o encadeamento; a política comercial da empresa define o que é obrigatório.

```text
Cliente
  -> Solicitacao (aprovada)
      -> Proposta (versao emitida / aceita)     [quando houver]
      -> Pedido de compra / PO                  [quando houver]
          -> Ordem de servico
              -> Planejamento e alocacao
              -> Execucao (inicio / pausa / retomada / conclusao)
              -> Evidencias e ocorrencias
              -> Medicao (itens, ajuste, envio, revisao, aprovar/rejeitar)
              -> Registro de faturamento
              -> Documento de faturamento (PDF; cancelar ou substituir)
```

**Rapidez:** cada etapa deixa de ser “achar no WhatsApp e recontar a história”. O próximo passo abre sobre o registro anterior.

**Tempo:** o ciclo deixa de ser limitado pela pessoa que “lembra do combinado”. Quem autoriza vê a fila; quem executa vê a OS liberada; quem fatura vê medição, não um recado.

**Custo (operacional, não o preço do software):** reduz retrabalho (refazer proposta, refazer medição, reemitir documento), vazamento (executar sem OS ou faturar sem medição) e disputa (versão errada do papel).

---

## 5. Funcionalidade por área (o que a pessoa usa)

### 5.1 Acesso e sessão

- Entrar com identidade.
- Renovar sessão e sair (desta sessão ou de todas).
- Páginas de sessão expirada, serviço indisponível e acesso negado — em vez de tela em branco ou “erro genérico”.
- Menu **só mostra** o que a pessoa pode listar; a API **bloqueia** o resto.

**Vantagem:** o investimento não é “login bonito”. É impedir que a recepção veja faturamento ou que um operador altere catálogo.

### 5.2 Clientes

- Listar, criar, ver, editar.
- Ativar e desativar (sem apagar o histórico operacional).

**Vantagem:** solicitações, propostas, OS e faturamento apontam para o mesmo cliente. Tempo de “quem era mesmo esse CNPJ?” cai para uma busca, não para pasta.

### 5.3 Pessoas

- Cadastro operacional de pessoas, histórico, ativar/desativar.

**Vantagem:** mão de obra e responsabilidade deixam de ser um nome solto no recado.

### 5.4 Catálogo de serviços

- Definições de serviço com **versões**.
- Rascunho, publicação, comparação entre versões.
- Unidades de medida.
- Ativar/desativar definição.

**Vantagem:** o serviço que foi vendido em março não “muda sozinho” quando o catálogo de agosto é alterado. Isso é o que evita cobrança contestada por “não era isso que combinamos”.

**Tempo:** montar proposta e OS em cima de item publicado, não de texto livre a cada pedido.

### 5.5 Ativos físicos e tipos de recurso

- Cadastro de ativos (veículo, equipamento, etc., conforme o que a empresa cadastrar).
- Tipos de recurso físico e tipos de mão de obra operacional, com ativar/desativar.

**Vantagem:** planejamento e alocação na OS usam cadastro, não observação. Relatório de utilização de ativo existe.

### 5.6 Solicitações de serviço

- Criar, listar, detalhe, editar rascunho.
- Enviar, revisar, aprovar, rejeitar, cancelar.
- **Converter em OS** quando aprovada.
- Anexar documentos à solicitação.

**Vantagem:** o pedido informal deixa de ser OS. A gestão vê o que ainda está em análise. Isso ataca o problema relatado de OS sem autorização.

**Rapidez:** converter gera a OS no mesmo sistema, sem redigitar o cliente e o pedido.

### 5.7 Propostas comerciais

- Criar e editar rascunho.
- **Várias versões** da mesma proposta.
- Emitir, aceitar, rejeitar, expirar, cancelar.
- Histórico de versões e documentos vinculados.

**Vantagem:** o cliente que “aceitou a segunda versão” fica registrado. Não se fatura a primeira página que estava no e-mail antigo.

**Custo evitado:** desconto ou escopo errado por usar PDF velho.

### 5.8 Pedidos de compra (PO)

- Criar, listar, editar.
- Registrar e cancelar.
- Documentos vinculados.

**Vantagem:** quando o cliente trabalha com PO, o saldo e a referência deixam de viver só na cabeça do comercial. A OS pode conviver com essa referência em vez de divergir depois na nota.

### 5.9 Ordens de serviço

- Criar, listar, detalhe, atualizar.
- **Preparar**, **liberar**, **cancelar** — ciclos explícitos, não um campo “status” editável à mão.

**Vantagem:** OS não “pula” de rascunho para execução sem o passo de liberação. Duas pessoas editando a mesma OS: o sistema usa controle de versão de linha (concorrência); a segunda alteração não apaga a primeira em silêncio.

### 5.10 Planejamento e alocação

- Recursos planejados: incluir, alterar, remover.
- Alocações: criar, realocar, remover.

**Vantagem:** “precisa de um caminhão e dois operadores” deixa de ser mensagem. Dá para ver conflito de alocação antes de chegar no pátio.

**Tempo:** o encarregado não remonta a equipe todo dia do zero se o plano já está na OS.

### 5.11 Execução (chão de operação)

Tela dedicada (não é o mesmo layout da listagem):

- Iniciar, pausar, retomar, concluir.
- Lançar quantidade, quilometragem, horímetro.
- Observação, ocorrência, evidência.

**Vantagem:** a prova do serviço nasce **durante** o trabalho, não na sexta à noite tentando lembrar o km.

**Rapidez:** pausa e retomada mostram OS parada de verdade, o que o relato apontava como tempo morto invisível.

### 5.12 Medição

- Criar medição a partir da OS; regenerar.
- Ajustar itens; registrar ajustes autorizados.
- Enviar, iniciar revisão, **aprovar** ou **rejeitar**.

**Vantagem:** o faturamento não é “o que o comercial acha que foi”. É o que passou por medição. Divergência vira rejeição formal, não discussão em áudio.

### 5.13 Faturamento operacional

- Painel de faturamento.
- Preparar registro de faturamento da OS; consultar; **anular** com motivo.
- Documento de faturamento: emitir, ver, **PDF**, cancelar, **substituir**.

**Vantagem:** serviço executado sem ligação com cobrança (problema relatado) deixa de ser o caminho fácil. Anular e substituir existem para correção controlada, não para apagar histórico.

**Nota:** emissão fiscal definitiva no ERP **não** está ligada. O Cisne prepara e documenta o operacional; o fiscal continua no sistema que a empresa já usar, quando a integração for autorizada.

### 5.14 Documentos (transversal)

- Envio, listagem, novas versões.
- Histórico de versão, conteúdo, URL de download.

**Vantagem:** ataca alteração indevida e perda de versão. Quem baixa, baixa uma versão numerada, não “o arquivo da mesa”.

### 5.15 Painel, alertas, busca e relatórios

- Painel operacional/executivo: OS ativas, aberturas no período, produtividade, gráficos de status, tendência, aging, atenção.
- Central de alertas com resumo (tipo, gravidade).
- Busca com filtros (texto, tipos, status, cliente, serviço, período).
- Relatórios com prévia e exportação (CSV, planilha, PDF), inclusive:
  - OS por período, por cliente, por serviço;
  - OS vencidas;
  - produtividade;
  - utilização de ativos;
  - medições;
  - aging financeiro;
  - faturamentos e recebimentos (estes últimos tratados como sensíveis no próprio catálogo de relatórios).

**Vantagem:** a pergunta “o que está parado e o que não entrou” deixa de depender de uma pessoa montar Excel. A gestão abre o painel.

**Tempo de decisão:** minutos para ver fila e atraso, não um fechamento de mês.

### 5.16 Administração e plataforma

- Diagnóstico da plataforma (só quem tem permissão).
- Saúde da API (vivo / pronto).
- Eventos de auditoria de segurança.
- Concessão e revogação de permissões (grants).

**Vantagem:** o investimento inclui **operar o sistema com segurança**, não só usar as telas de OS.

### 5.17 Notificações e integrações (o que existe, com limite honesto)

- Motor de notificação com intenção, canal, tentativas e não reenvio duplicado.
- Integração com sistemas externos (ERP / rastreio) **existe como parede (ACL)** e permanece **desligada** até configuração e confirmação. Não há sincronização inventada “para parecer completo”.

**Vantagem de pagar isso mesmo desligado:** quando o ERP for ligado, o núcleo operacional **não** precisa ser reescrito. Quem compra “só a telinha” paga de novo na hora de integrar.

---

## 6. Tempo, rapidez e custo — sem números inventados

Não há, neste repositório, tempos médios medidos de atendimento nem volumes reais de OS. O que dá para afirmar com honestidade:

### Tempo (ciclo da operação)

| Sem sistema estruturado | Com o que está implementado |
| ----------------------- | --------------------------- |
| Pedido, autorização, execução e cobrança misturados no mesmo chat | Cada fase tem estado; o próximo passo só existe se o anterior permitir |
| Retrabalho para achar “a versão certa” da proposta ou do laudo | Versão é função do sistema |
| Fechamento depende de reunir prints | Medição + evidência + documento já estão na OS |
| Contar atraso é opinião | Relatório de vencidas + aging + alertas |

O ganho de tempo não é “o computador é mais rápido que o ser humano”. É **parar de refazer o mesmo controle**.

### Rapidez (resposta da gestão)

- Busca única em vez de pastas e grupos.
- Painel no lugar de reunião só para listar OS abertas.
- Alerta no lugar de descobrir o gargalo no dia do faturamento.

Quem decide vê o mesmo dado que quem executa (respeitada a permissão). Isso encurta o vai-e-volta.

### Custo (vazamento e retrabalho — não o preço do produto)

Custo operacional típico que este desenho reduz, **se a equipe usar o fluxo**:

- Executar serviço que nunca virou OS autorizada.
- Faturar o que não foi medido (ou o inverso: medir e não faturar).
- Emitir documento em cima da proposta errada.
- Dois operadores gravarem a mesma OS e um apagar o lançamento do outro.
- Pessoa sem papel ver ou alterar faturamento e documento.

Custo que **não** desaparece sozinho: disciplina de uso, piloto, e o que ainda está fora (fiscal, rastreio ao vivo, WhatsApp como canal oficial).

### Por que isso justifica um investimento maior que “um sistema de OS”

Porque o núcleo caro não é a lista de OS. É o conjunto que um ERP genérico ou uma planilha **não** trazem juntos:

- máquina de estados (solicitação, OS, execução, medição, faturamento, documento);
- autorização no backend;
- concorrência e idempotência em comandos críticos;
- versão de catálogo, proposta e documento;
- evidência na execução ligada à medição;
- relatórios e aging com escopo por permissão;
- testes automatizados e trilha de auditoria;
- integração futura isolada, sem misturar ERP no meio da OS.

Isso é o que diferencia **software operacional crítico** de **planilha com senha**.

---

## 7. O que ainda não está no investimento deste produto

Para não vender o que não existe:

- Go-live de produção ainda **bloqueado** até o piloto cumprir a janela de observação e haver autorização de saída.
- Integração ERP e rastreio **não operam ao vivo**.
- Não há, aqui, confirmação de que o Cisne substitui o ERP.
- WhatsApp como canal de entrada **não** está automatizado; a solicitação entra pelo sistema (o relato cita WhatsApp só como forma atual de contato).
- SLA, RPO e RTO com valores de contrato **não** são afirmados neste documento.
- Módulos de representação comercial “pura”, fretamento de passageiros ou locação como produto separado **não** são telas à parte: o que existe é a **vertical de serviços com recursos** (a locação foi citada como prioridade econômica no contexto, não como módulo isolado confirmado).

---

## 8. Como ler este documento numa negociação

1. **Funcionalidade real** = o que está nas seções 5.1 a 5.17, espelhado em API + web.
2. **Vantagem** = menos furo entre pedido, autorização, prova, medição e cobrança.
3. **Tempo** = menos ciclo de retrabalho e menos “caçar informação”.
4. **Rapidez** = painel, busca, alerta e conversão solicitação para OS.
5. **Custo** = vazamento e disputa, não a tabela de preço.
6. **Por que não é barato como um cadastro** = estados, permissão, versão, auditoria, medição e faturamento no mesmo fio.

Se a alternativa for “a gente se vira no WhatsApp e no Excel”, o comparativo correto é o **custo de uma OS errada, uma cobrança não reconhecida ou um mês fechado no escuro** — não o custo de uma planilha vazia.
