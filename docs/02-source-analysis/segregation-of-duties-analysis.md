# Análise — Segregação de funções

| Campo | Valor |
| --- | --- |
| Document ID | SOD-001 |
| Evidências | EV-036, EV-041, EV-042, EV-043, EV-078, EV-079–EV-080 |

## Matriz preliminar (sem atores nomeados)

| Função / ação | Suporte na fonte | Classificação |
| --- | --- | --- |
| Solicitar serviço/OS | EV-037 | PARTIALLY_SUPPORTED |
| Autorizar / liberar OS | EV-039 | PARTIALLY_SUPPORTED |
| Mesma pessoa criar e liberar OS | EV-043 | DECISION_PENDING — DDP-022 |
| Solicitar = autorizar | EV-041 | **SUPPORTED (deve ser distinto)** — BR-025 |
| Rascunho = liberar execução | EV-042 | **SUPPORTED (deve ser distinto)** — BR-007 |
| Abrir OS sem restrição (operacional) | EV-036 | **SUPPORTED (preocupação explícita)** |
| Visualizar custo interno | EV-060 | NOT_SUPPORTED |
| Visualizar margem | EV-060 | NOT_SUPPORTED |
| Alterar preço comercial | EV-060 | NOT_SUPPORTED |
| Controlar documentos críticos (gestão) | EV-080 | PARTIALLY_SUPPORTED |
| Alterar documentos (restrito) | EV-079, EV-021 | PARTIALLY_SUPPORTED |
| Segregação de funções (geral) | EV-078 | PARTIALLY_SUPPORTED — investigar |
| Acesso por necessidade | EV-078 | PARTIALLY_SUPPORTED |
| Maker-checker explícito | — | NOT_SUPPORTED |

## Legenda

| Classificação | Significado |
| --- | --- |
| SUPPORTED | Fonte indica distinção ou restrição clara |
| PARTIALLY_SUPPORTED | Tema presente; detalhes e atores ausentes |
| NOT_SUPPORTED | Sem base na fonte |
| DECISION_PENDING | Pergunta explícita aberta |

## Decisões e riscos

| ID | Tema |
| --- | --- |
| DDP-015 | Permissões e incompatibilidades |
| DDP-022 | Criar vs liberar mesma pessoa |
| DDP-030 | Custo/margem/preço |
| RISK-007 | Acesso indevido |
| RISK-013 | Permissão excessiva |
| RISK-022 | Confusão rascunho/liberação mesma pessoa |

Não inventar papéis (admin, gerente, etc.) sem fonte.
