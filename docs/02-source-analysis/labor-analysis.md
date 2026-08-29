# Análise — Mão de obra

| Campo       | Valor                         |
| ----------- | ----------------------------- |
| Document ID | LA-001                        |
| Evidências  | EV-018, EV-054–EV-057, EV-047 |

## LABOR_TYPE (tipos citados)

| Tipo citado                    | Status          | Evidência |
| ------------------------------ | --------------- | --------- |
| Ajudante                       | FIELD_CANDIDATE | EV-054    |
| Motorista                      | FIELD_CANDIDATE | EV-054    |
| Operador                       | FIELD_CANDIDATE | EV-054    |
| Supervisor                     | FIELD_CANDIDATE | EV-054    |
| Outros relacionados ao serviço | FIELD_CANDIDATE | EV-054    |

## Distinções obrigatórias (preliminar)

| Conceito                          | Classificação           | Evidência | BR     |
| --------------------------------- | ----------------------- | --------- | ------ |
| TIPO DE MÃO DE OBRA               | DOMAIN_ENTITY_CANDIDATE | EV-055    | BR-012 |
| PESSOA EXECUTORA                  | DOMAIN_ENTITY_CANDIDATE | EV-055    | BR-012 |
| Planejamento sem pessoa escolhida | HYPOTHESIS              | EV-056    | BR-012 |

## Problema as-is

Mão de obra registrada somente em observações — EV-018.

## Unidades e cobrança (pendente)

| Aspecto                                       | Status | DDP        |
| --------------------------------------------- | ------ | ---------- |
| Hora, diária, turno, presença                 | OPEN   | DDP-030    |
| Hora extra                                    | OPEN   | SRC-001 §9 |
| Inclusão no preço global vs cobrança separada | OPEN   | DDP-031    |
| Mão de obra adicional — autorização           | OPEN   | DDP-006    |
| Substituição de executor                      | OPEN   | DDP-006    |
| Apontamento                                   | OPEN   | DDP-006    |

## Campos na OS

Ajudantes, motoristas, operadores citados como conteúdo operacional — EV-047. Obrigatoriedade: DDP-035.

## Síntese

Fonte sustenta **tipologia** e **separação tipo/pessoa**. Não sustenta folha, terceirização, nem regras de apontamento.
