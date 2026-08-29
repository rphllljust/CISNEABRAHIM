# Domain decisions pending

| Campo             | Valor                                                   |
| ----------------- | ------------------------------------------------------- |
| Document ID       | DDP-REG-001                                             |
| Last updated      | 2026-08-29 (Prompt 29-A corretivo)                      |
| Status of answers | **PARTIAL** — DDP-020 (CLIENT), DDP-028, DDP-041 respondidas no escopo SRC-002 |

Status típicos: `OPEN`, `BLOCKING`, `ANSWERED`, `SUPERSEDED`. Todas as entradas abaixo estão `OPEN` e `BLOCKING` para implementação do tema.

Não responder. Não inventar estados, cardinalidades, SLAs, RPO, RTO ou volumes.

Template: [`../templates/domain-decision-template.md`](../templates/domain-decision-template.md).

## DDP-001 — Tipos de OS

Quais tipos de Ordem de Serviço existem? Quem os define? Um tipo por atividade (transporte, locação, etc.) ou taxonomia distinta?

**Status:** `OPEN` · **Bloqueia implementação de OS:** sim

## DDP-002 — Fluxo de solicitação

Como uma solicitação nasce, quem pode criá-la, o que a torna válida, e se toda solicitação gera OS?

**Status:** `OPEN` · **Bloqueia implementação de solicitação/OS:** sim

## DDP-003 — Liberação da OS

Existe liberação? Por quem? Com base em quê (crédito, PO, agenda, frota)? O que ocorre se não houver liberação?

**Status:** `OPEN` · **Bloqueia implementação de OS:** sim

## DDP-004 — Cancelamento

Quem cancela solicitação, OS, PO, medição ou fatura? Quais efeitos colaterais (alocação, documentos, financeiro)?

**Status:** `OPEN` · **Bloqueia implementação dos cancelamentos:** sim

## DDP-005 — Reabertura

Reabertura é permitida? De quais artefatos? Com quais restrições de auditoria e financeiro?

**Status:** `OPEN`

## DDP-006 — Mão de obra

Como pessoas são identificadas, alocadas, substituídas e apuradas? Existe folha, terceiros, diária, hora?

**Status:** `OPEN`

## DDP-007 — Equipamentos

Quais equipamentos entram no sistema? Alocação exclusiva? Manutenção? Locação própria vs de terceiro?

**Status:** `OPEN`

## DDP-008 — Veículos

Controle de frota própria, agregados, rastreador, jornada, documentos do veículo?

**Status:** `OPEN`

## DDP-009 — Purchase Order (PO)

O PO é obrigatório? Origem (cliente interno vs cliente externo)? Um PO para N OS ou N PO para uma OS? Estouro de saldo?

**Status:** `OPEN` · **Bloqueia implementação de PO e de OS ligada a PO:** sim

## DDP-010 — Medição

O que é medido, quem mede, com qual evidência, e quando a medição é recusada?

**Status:** `OPEN`

## DDP-011 — Faturamento

O que gera direito a faturar? Relação com medição, contrato, NF-e e outros documentos fiscais (regras fiscais **não** inventadas)?

**Status:** `OPEN`

## DDP-012 — Pagamento

Como se registra pagamento? Conciliação? Falha do meio de pagamento?

**Status:** `OPEN`

## DDP-013 — Documentos

Quais documentos lógicos existem, obrigatoriedade, versões, validade, e quem é o emissor?

**Status:** `OPEN`

## DDP-014 — Integrações

Quais sistemas externos existem (ERP, fiscal, rastreamento, bancos)? Quem é Source of Truth por dado?

**Status:** `OPEN`

## DDP-015 — Permissões

Quais funções, segregações e incompatibilidades (maker-checker) existem? Sem inventar papéis.

**Status:** `OPEN` · **Bloqueia implementação de autorização de negócio:** sim

## DDP-016 — RPO e RTO

Quais objetivos de ponto e tempo de recuperação? Valores atuais: `UNKNOWN`. Não atribuir números.

**Status:** `OPEN`

## DDP-017 — Volume

Ordens, usuários, documentos, picos? `UNKNOWN`.

**Status:** `OPEN`

## DDP-018 — Operação offline

Há exigência de operação sem rede? Em quais papéis e com quais conflitos de sincronização?

**Status:** `OPEN`

## DDP-019 — Retenção

Prazos legais e empresariais de guarda de dados e documentos? `NOT_PROVIDED`.

**Status:** `OPEN`

## DDP-020 — Source of Truth

Para cada conceito crítico (OS, saldo de PO, medição, fatura, pagamento, cadastro), qual sistema é autoritativo?

**Status:** `PARTIALLY_ANSWERED` — **escopo CLIENTE resolvido** (SRC-002 Q04, Prompt 29-A corretivo): CISNE = master operacional do Cliente; ERP/fiscal = autoridade de domínios externos quando integração existir; `externalErpId` opcional, nunca PK. Demais conceitos (OS, PO, medição, fatura, pagamento, documentos, WhatsApp) permanecem `OPEN`.

**Bloqueia implementação de Clientes:** não (escopo CLIENTE) · **Bloqueia integrações definitivas de outros domínios:** sim

## DDP-021 — Canal WhatsApp

WhatsApp continuará sendo canal oficial de solicitação? O sistema substituirá ou apenas registrará conversas? Qual o Source of Truth da mensagem?

**Status:** `OPEN` · **Fonte:** SRC-001 EV-027, EV-032, EV-033 · **Risco:** RISK-018

## DDP-022 — Criar vs liberar OS (mesma pessoa)

A mesma pessoa pode criar rascunho e liberar OS? Existe segregação maker-checker obrigatória?

**Status:** `OPEN` · **Bloqueia:** autorização de OS · **Fonte:** EV-043 · **Risco:** RISK-022

## DDP-023 — Modo de emissão fiscal

O Sistema Cisne emitirá documento fiscal oficial, registrará documento externo, integrará ERP/fiscal/municipal ou apenas fatura/recibo não fiscal?

**Status:** `OPEN` · **Bloqueia:** módulo fiscal · **Fonte:** EV-064, EV-065 · **Risco:** RISK-012

## DDP-024 — Faixas de aging

Quais faixas de tempo definem solicitação/OS/medição/nota/pagamento “parados”? Valores atuais: nenhum confirmado — **proibido inventar** (EV-076).

**Status:** `OPEN` · **Fonte:** EV-074–EV-076

## DDP-025 — PWA

Existe exigência de Progressive Web App ou experiência mobile instalável?

**Status:** `OPEN` · **Fonte:** SRC-001 §22

## DDP-026 — Escopo do primeiro release

Quais verticais (locação citada como prioridade candidata em §21) entram no primeiro release? Confirmação formal da direção necessária.

**Status:** `PARTIALLY_ANSWERED` — módulo **Clientes PJ** confirmado no Release 1 (SRC-002 Q01). Demais verticais permanecem `OPEN`.

**Bloqueia:** escopo completo de produto · **Fonte:** EV-003, EV-080–EV-082, SRC-002 · **Risco:** RISK-021

## DDP-027 — Chassi — exibição vs armazenamento

Como tratar chassi e dados sensíveis de veículo (máscara em tela vs armazenamento completo)?

**Status:** `OPEN` · **Fonte:** EV-052

## DDP-028 — Quem pode solicitar serviço

Quem pode solicitar? Solicitante interno ou externo? Lista de perfis?

**Status:** `ANSWERED` (SRC-002, Prompt 29-A corretivo) — Origem da demanda pode ser externa (cliente, contato, WhatsApp, PO, contrato, proposta, etc.). No Release 1, registro transacional da Solicitação é por usuário interno autorizado. Solicitante externo não cria/libera OS nem altera custo/preço/faturamento. Separar `REQUEST_ORIGIN` de `SYSTEM_ACTOR` e `AUTHORIZED_APPROVER`.

**Fonte:** EV-029, SRC-002 · **Bloqueia implementação de Solicitação (escopo R1):** não

## DDP-029 — Prontidão para liberação da OS

Quais condições tornam a OS pronta para liberação (crédito, PO, agenda, frota)?

**Status:** `OPEN` · **Bloqueia:** liberação · **Fonte:** EV-044

## DDP-030 — Visibilidade e alteração de custo, margem e preço

Quem visualiza custo e margem? Quem altera preço? Unidades de cobrança de mão de obra?

**Status:** `OPEN` · **Fonte:** EV-057, EV-060

## DDP-031 — Modelo de preço

Preço global, por item ou híbrido? Descontos e adicionais?

**Status:** `OPEN` · **Fonte:** EV-061

## DDP-032 — Estados de responsabilidade e handoff

Classificação de ASSIGNED, VIEWED, etc. como evento, estado ou auditoria. OS concluída pode receber novos itens?

**Status:** `OPEN` · **Fonte:** EV-083–EV-061, SRC-001 §6

## DDP-033 — Documentos críticos e controle

Quais tipos de documentos são críticos? Quem controla substituição e aprovação (gestão — nomes TBD)?

**Status:** `OPEN` · **Fonte:** EV-080, EV-081

## DDP-034 — Campos obrigatórios de equipamento/veículo

Placa, prefixo, chassi, RENAVAM, quilometragem, horímetro — quais são obrigatórios por tipo de serviço?

**Status:** `OPEN` · **Fonte:** EV-052

## DDP-035 — Composição da OS por tipo de serviço

Quais campos da OS são obrigatórios para cada tipo de serviço?

**Status:** `OPEN` · **Fonte:** EV-047, EV-048

## DDP-036 — Targets de performance por classe de operação

Quais classes de operação (consulta, transação, relatório, upload, integração) terão metas de tempo de resposta e quais valores a empresa autoriza?

**Status:** `OPEN` · **Bloqueia dimensionamento:** sim · **Fonte:** Prompt 03 / EV-074, EV-075

## DDP-037 — Política de concorrência e idempotência por operação

Para cada operação crítica (criar solicitação, converter, liberar, alocar, medição, faturamento, documento), qual política de concorrência e repetição a empresa exige — sem escolher tecnologia nesta etapa?

**Status:** `OPEN` · **Bloqueia implementação transacional:** sim · **Fonte:** Prompt 03 / EV-079, EV-028

## DDP-038 — Observabilidade mínima operacional

Quais eventos de negócio, métricas, traces e alertas são obrigatórios para operação e auditoria? Como separar AUDIT_TRAIL de TECHNICAL_LOG?

**Status:** `OPEN` · **Fonte:** Prompt 03 / EV-074, EV-078

## DDP-039 — Classificação de dados pessoais no domínio

Quais campos do sistema contêm dados pessoais, qual finalidade, minimização aplicável e validação legal necessária?

**Status:** `OPEN` · **Bloqueia política de privacidade:** sim · **Fonte:** Prompt 03 / EV-029, EV-030 · **Nota:** PENDING_LEGAL_VALIDATION

## DDP-040 — Nível de disponibilidade aceitável

Qual disponibilidade mínima em horário operacional, tolerância a manutenção planejada e requisitos para integrações críticas?

**Status:** `OPEN` · **Fonte:** Prompt 03 / EV-005 · **Targets:** TARGET_PENDING

## DDP-041 — Campos mínimos do Cliente PJ

Quais campos são obrigatórios e opcionais no cadastro de Cliente PJ no Release 1?

**Status:** `ANSWERED` (SRC-002 Q06, Prompt 29-A corretivo) — Obrigatórios: razão social, CNPJ, pelo menos um contato operacional utilizável. Opcionais quando suportados: nome fantasia, código externo/ERP, telefone, e-mail, endereços, observações estritamente necessárias. Sem campos CRM/fiscais avançados não aprovados.

**Fonte:** SRC-002 Q06 · **Bloqueia implementação de Clientes:** não

## Próximo ID

`DDP-042`.
