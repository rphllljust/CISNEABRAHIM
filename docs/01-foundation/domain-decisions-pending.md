# Domain decisions pending

| Campo | Valor |
| --- | --- |
| Document ID | DDP-REG-001 |
| Status of answers | **NONE** — perguntas abertas; respostas não autorizadas neste Prompt 00 |

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

**Status:** `OPEN` · **Bloqueia integrações e persistência definitiva:** sim

## Próximo ID

`DDP-021`.
