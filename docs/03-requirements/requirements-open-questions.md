# REQ-RQ-001

| Campo | Valor |
| --- | --- |
| Document ID | Questões abertas |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Prompt | 02 |
| Total | 25 |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
## Direção

### RQ-QUESTION-001

**Pergunta:** Quais tipos de OS existem e quais fluxos se aplicam a cada tipo?

- **Requisitos afetados:** FR-010
- **Regras afetadas:** BR-025
- **Evidências:** EV-036
- **DDP:** DDP-022
- **Criticidade:** HIGH
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-002

**Pergunta:** Qual o escopo do primeiro release operacional?

- **Requisitos afetados:** FR-001
- **Regras afetadas:** BR-003
- **Evidências:** EV-080
- **DDP:** DDP-001
- **Criticidade:** HIGH
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

## Operação

### RQ-QUESTION-003

**Pergunta:** Quem pode liberar OS e quais critérios mínimos de preparação?

- **Requisitos afetados:** FR-014
- **Regras afetadas:** BR-006
- **Evidências:** EV-013, EV-039
- **DDP:** DDP-003
- **Criticidade:** CRITICAL
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-004

**Pergunta:** Confirmação de recebimento pelo responsável é obrigatória?

- **Requisitos afetados:** FR-016
- **Regras afetadas:** BR-019
- **Evidências:** EV-073
- **DDP:** DDP-015
- **Criticidade:** MEDIUM
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-005

**Pergunta:** Quais canais de entrada de solicitação serão suportados?

- **Requisitos afetados:** FR-002
- **Regras afetadas:** BR-005
- **Evidências:** EV-031, EV-032
- **DDP:** DDP-021
- **Criticidade:** MEDIUM
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-006

**Pergunta:** Reabertura de OS concluída é permitida e em quais condições?

- **Requisitos afetados:** FR-021
- **Regras afetadas:** BR-024
- **Evidências:** EV-047
- **DDP:** DDP-005
- **Criticidade:** LOW
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

## Comercial

### RQ-QUESTION-007

**Pergunta:** PO é obrigatório para todas as OS ou apenas em alguns contratos?

- **Requisitos afetados:** FR-029, FR-033
- **Regras afetadas:** BR-002
- **Evidências:** EV-057, EV-059
- **DDP:** DDP-009
- **Criticidade:** HIGH
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-008

**Pergunta:** Qual cardinalidade entre proposta, pedido e OS?

- **Requisitos afetados:** FR-029
- **Regras afetadas:** BR-002
- **Evidências:** EV-055
- **DDP:** DDP-030
- **Criticidade:** HIGH
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-009

**Pergunta:** Alteração de preço após liberação da OS é permitida?

- **Requisitos afetados:** FR-031
- **Regras afetadas:** BR-013
- **Evidências:** EV-060
- **DDP:** DDP-030
- **Criticidade:** HIGH
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-010

**Pergunta:** Quem aprova ou rejeita solicitações de serviço?

- **Requisitos afetados:** FR-006
- **Regras afetadas:** BR-024
- **Evidências:** EV-033
- **DDP:** DDP-002
- **Criticidade:** HIGH
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

## Financeiro

### RQ-QUESTION-011

**Pergunta:** Quem pode visualizar custo e margem?

- **Requisitos afetados:** FR-032
- **Regras afetadas:** BR-018
- **Evidências:** EV-061, EV-078
- **DDP:** DDP-009
- **Criticidade:** HIGH
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-012

**Pergunta:** Medição é obrigatória antes de faturamento?

- **Requisitos afetados:** FR-035, FR-039
- **Regras afetadas:** BR-009
- **Evidências:** EV-062, EV-074
- **DDP:** DDP-011
- **Criticidade:** HIGH
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-013

**Pergunta:** Como tratar saldo insuficiente de PO?

- **Requisitos afetados:** FR-033
- **Regras afetadas:** BR-008
- **Evidências:** EV-060
- **DDP:** DDP-009
- **Criticidade:** MEDIUM
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

## Fiscal

### RQ-QUESTION-014

**Pergunta:** O sistema registrará apenas notas informadas ou haverá emissão integrada?

- **Requisitos afetados:** FR-039
- **Regras afetadas:** BR-015
- **Evidências:** EV-064, EV-066
- **DDP:** DDP-023
- **Criticidade:** HIGH
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-015

**Pergunta:** Quais campos fiscais mínimos devem ser preservados em registro informativo?

- **Requisitos afetados:** FR-039
- **Regras afetadas:** BR-019
- **Evidências:** EV-064
- **DDP:** DDP-023
- **Criticidade:** MEDIUM
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

## Contabilidade

### RQ-QUESTION-016

**Pergunta:** Qual sistema é Source of Truth para pagamentos?

- **Requisitos afetados:** FR-039
- **Regras afetadas:** BR-024
- **Evidências:** EV-066
- **DDP:** DDP-024
- **Criticidade:** HIGH
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

## Responsável documental

### RQ-QUESTION-017

**Pergunta:** Quais tipos documentais são críticos no primeiro release?

- **Requisitos afetados:** FR-041
- **Regras afetadas:** BR-016
- **Evidências:** EV-081
- **DDP:** DDP-033
- **Criticidade:** MEDIUM
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-018

**Pergunta:** Quem pode substituir documentos controlados?

- **Requisitos afetados:** FR-042
- **Regras afetadas:** BR-016, BR-020
- **Evidências:** EV-021, EV-080
- **DDP:** DDP-013
- **Criticidade:** HIGH
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

## TI

### RQ-QUESTION-019

**Pergunta:** ERP existente e contratos de integração disponíveis?

- **Requisitos afetados:** FR-029
- **Regras afetadas:** BR-005
- **Evidências:** EV-077
- **DDP:** DDP-019
- **Criticidade:** HIGH
- **Bloqueia implementação:** Sim
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-020

**Pergunta:** WhatsApp será usado como canal obrigatório ou apenas capacidade opcional?

- **Requisitos afetados:** FR-002
- **Regras afetadas:** BR-005
- **Evidências:** EV-077
- **DDP:** DDP-021
- **Criticidade:** LOW
- **Bloqueia implementação:** Não
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-021

**Pergunta:** Requisitos de operação offline e sincronização?

- **Requisitos afetados:** FR-018
- **Regras afetadas:** BR-024
- **Evidências:** EV-083
- **DDP:** DDP-018
- **Criticidade:** MEDIUM
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

## Jurídico

### RQ-QUESTION-022

**Pergunta:** Política de retenção documental e prazos legais?

- **Requisitos afetados:** FR-042
- **Regras afetadas:** BR-016
- **Evidências:** EV-083
- **DDP:** DDP-033
- **Criticidade:** MEDIUM
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

## Cliente

### RQ-QUESTION-023

**Pergunta:** Cliente externo pode registrar solicitação diretamente?

- **Requisitos afetados:** FR-001, FR-002
- **Regras afetadas:** BR-005
- **Evidências:** EV-031
- **DDP:** DDP-021
- **Criticidade:** MEDIUM
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-024

**Pergunta:** Cliente consulta status de OS ou solicitação?

- **Requisitos afetados:** FR-005
- **Regras afetadas:** BR-024
- **Evidências:** EV-030
- **DDP:** DDP-002
- **Criticidade:** LOW
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

### RQ-QUESTION-025

**Pergunta:** Quais evidências o cliente deve anexar na solicitação?

- **Requisitos afetados:** FR-004
- **Regras afetadas:** BR-024
- **Evidências:** EV-030
- **DDP:** DDP-002
- **Criticidade:** LOW
- **Bloqueia implementação:** Parcial
- **Bloqueia Prompt 03:** Não
- **Status:** OPEN

---

## Questões de glossário (Prompt 04 — GLQ)

Referência completa: [`../05-ubiquitous-language/terms-pending-business-validation.md`](../05-ubiquitous-language/terms-pending-business-validation.md).

| GLQ | Pergunta resumida | TERM | DDP |
| --- | --- | --- | --- |
| GLQ-001 | Tipos formais de OS | TERM-002 | DDP-001 |
| GLQ-002 | Taxonomia mão de obra | TERM-028 | DDP-006 |
| GLQ-003 | Pedido, proposta, contrato, PO | TERM-011..014 | DDP-009 |
| GLQ-004 | Medição: entidade ou fase | TERM-016 | DDP-010 |
| GLQ-005 | Nota fiscal vs informado | TERM-018 | DDP-023 |
| GLQ-006 | Responsável vs executor vs autorizador | TERM-006..008 | DDP-015, DDP-022 |
| GLQ-007 | ASSIGNED / VIEWED / ACKNOWLEDGED | TERM-008 | DDP-032 |
| GLQ-008 | Equipamento vs veículo | TERM-025, TERM-026 | DDP-007, DDP-034 |
| GLQ-009 | Fórmula de margem | TERM-022 | DDP-031 |
| GLQ-010 | WhatsApp obrigatório | TERM-036 | DDP-021 |
| GLQ-011 | Source of Truth integrações | TERM-037 | DDP-020 |
| GLQ-012 | Nome legal OS vs sigla | TERM-002 | — |
