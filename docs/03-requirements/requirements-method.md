# REQ-METHOD-001

| Campo             | Valor                          |
| ----------------- | ------------------------------ |
| Document ID       | Método de requisitos           |
| Fonte             | SRC-001                        |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em         | 2026-08-28                     |
| Prompt            | 02                             |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.

## Processo aplicado no Prompt 02

1. Leitura integral da governança, fundação e análise de fontes (Prompt 01).
2. Derivação de requisitos funcionais candidatos exclusivamente a partir de evidências (EV-_) e regras candidatas (BR-_).
3. Formulação de casos de uso e critérios de aceite verificáveis, sem especificação de interface ou tecnologia.
4. Registro explícito de pendências (DDP-*) e classificação sem uso de `CONFIRMED` para SRC-001 isolada.

## Identificadores imutáveis

| Prefixo      | Significado                            |
| ------------ | -------------------------------------- |
| FR-          | Requisito funcional                    |
| UC-          | Caso de uso                            |
| AC-          | Critério de aceite                     |
| VR-          | Regra de validação empresarial         |
| AUTH-REQ-    | Necessidade de autorização empresarial |
| DR-          | Requisito de dado                      |
| DOC-REQ-     | Requisito documental                   |
| NOTIF-REQ-   | Requisito de notificação               |
| INT-REQ-     | Requisito de integração                |
| RPT-REQ-     | Requisito de relatório                 |
| EX-          | Exceção ou erro empresarial            |
| RQ-QUESTION- | Questão aberta                         |
| CAP-         | Capacidade empresarial                 |

## Status permitidos (requisitos)

`DRAFT`, `PENDING_SOURCE_VALIDATION`, `PENDING_BUSINESS_DECISION`, `BLOCKED`, `CONFIRMED`, `REJECTED`, `SUPERSEDED`

**Regra Prompt 02:** requisitos derivados apenas de SRC-001 utilizam `PENDING_SOURCE_VALIDATION` ou `PENDING_BUSINESS_DECISION`. Nenhum `CONFIRMED` sem fonte primária.

## Tipos de requisito funcional

`CORE_FUNCTION`, `VALIDATION`, `AUTHORIZATION`, `DATA`, `DOCUMENT`, `NOTIFICATION`, `INTEGRATION`, `REPORTING`, `AUDITABILITY`, `RECOVERY`

## Obrigatoriedade

`REQUIRED`, `OPTIONAL`, `CONDITIONAL`, `CAPABILITY_ONLY`, `UNKNOWN`

## Escopo

`GLOBAL`, `CLIENT`, `CONTRACT`, `PURCHASE_ORDER`, `SERVICE_TYPE`, `UNIT`, `UNKNOWN`

## Formato normativo

Todo requisito funcional utiliza declaração tecnologicamente agnóstica: **«O sistema deverá...»**.

## Casos de uso

Etapas não sustentadas por evidência são marcadas como `STEP_PENDING_DECISION`.

## Notificações

Diferenciar `EVENT_MUST_BE_RECORDED` de `NOTIFICATION_MAY_BE_REQUIRED`. WhatsApp permanece `CAPABILITY_ONLY`, nunca `REQUIRED`.

## Integrações

Todas permanecem `PENDING_EXTERNAL_DOCUMENTATION` até contrato técnico e fonte primária.
