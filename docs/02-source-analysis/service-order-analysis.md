# Análise — Ordem de Serviço

| Campo | Valor |
| --- | --- |
| Document ID | SOA-001 |
| Evidências | EV-013, EV-036–EV-048 |

## Verbos e ações — classificação

| Verbo / ação | Classificação | Evidência | Promoção |
| --- | --- | --- | --- |
| solicitar (OS) | DOMAIN_EVENT_CANDIDATE | EV-037 | Aguardar DDP-003 |
| analisar solicitação | DOMAIN_STATE_CANDIDATE | EV-038 | Aguardar DDP-003 |
| criar rascunho | DOMAIN_STATE_CANDIDATE | EV-042 | Distinto de liberar — BR-007 |
| editar rascunho | OPEN_QUESTION | SRC-001 §6 | DDP-003 — não detalhado em EV |
| liberar OS | DOMAIN_STATE_CANDIDATE | EV-039 | Aguardar DDP-003, DDP-022 |
| abrir OS oficial | DOMAIN_STATE_CANDIDATE | EV-039 | Sinônimo preliminar de liberar |
| receber OS (executor) | DOMAIN_EVENT_CANDIDATE | EV-040 | Handoff — DDP-032 |
| executar serviço | NOT_SUPPORTED (detalhe) | — | Fora do detalhe SRC-001 |
| concluir OS | NOT_SUPPORTED | — | DDP-004 |
| cancelar OS | DECISION_PENDING | SRC-001 §6 | DDP-004 |
| reabrir OS | DECISION_PENDING | SRC-001 §6 | DDP-005 |
| recusar liberação | DECISION_PENDING | SRC-001 §6 | DDP-003 |
| adicionar itens pós-conclusão | DECISION_PENDING | SRC-001 §6 | DDP-032 |
| visualizar OS | DOMAIN_EVENT_CANDIDATE | EV-016 (problema) | DDP-032 |

## Estados candidatos (não confirmados)

| Estado candidato | Origem | Status |
| --- | --- | --- |
| RASCUNHO | EV-042 | CANDIDATE — distinto de liberada |
| AGUARDANDO_LIBERACAO | EV-038, EV-044 | CANDIDATE |
| LIBERADA | EV-039, EV-040 | CANDIDATE |
| CONCLUIDA | — | NOT_SUPPORTED |

## Conteúdo da OS

| Aspecto | Classificação | Evidência |
| --- | --- | --- |
| Lista ampla de campos possíveis | PARTIALLY_SUPPORTED | EV-047 |
| Obrigatoriedade universal de campos | NOT_SUPPORTED | EV-048 |
| Representar serviço planejado/autorizado | PARTIALLY_SUPPORTED | EV-046 |

## Síntese

SRC-001 sustenta fortemente a **segregação solicitar/autorizar** e **rascunho/liberação**. Não sustenta máquina de estados completa nem tipos de OS.
