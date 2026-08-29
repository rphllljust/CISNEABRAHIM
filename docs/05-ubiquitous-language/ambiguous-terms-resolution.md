# UL-AMBIG-001

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Document ID | Resolução de termos ambíguos   |
| Fonte       | AT-001 (Prompt 01) + Prompt 04 |
| Prompt      | 04                             |

> Ambiguidades **não resolvidas** sem fonte primária ou DDP encerrado.

## Status de resolução

| Termo (AT-001)                           | TERM(s)                      | Resolução Prompt 04                                 | DDP                   |
| ---------------------------------------- | ---------------------------- | --------------------------------------------------- | --------------------- |
| OS / Ordem de Serviço                    | TERM-002, TERM-009, TERM-010 | Parcial — fronteira definida; tipos/estados abertos | DDP-001, DDP-003      |
| Solicitação                              | TERM-001, TERM-045           | Parcial — distinto de OS                            | DDP-002               |
| Serviço                                  | TERM-003                     | Aberto — escopo por atividade                       | DDP-026, DDP-035      |
| Cliente                                  | TERM-004                     | Aberto — cadastro TBD                               | DDP-002               |
| Executor                                 | TERM-006                     | Aberto — papel formal TBD                           | DDP-006               |
| Pessoa autorizada                        | TERM-007                     | Parcial — renomeado Autorizador empresarial         | DDP-015               |
| PO                                       | TERM-013                     | Aberto — cardinalidade                              | DDP-009               |
| Pedido / Proposta / Contrato             | TERM-011..014                | Aberto — encadeamento                               | DDP-009               |
| Medição / Faturamento / Nota / Pagamento | TERM-016..019                | Parcial — fronteiras; processos TBD                 | DDP-010..012, DDP-023 |
| Custo / Preço / Margem                   | TERM-020..022                | Parcial — distinção custo≠preço                     | DDP-030, DDP-031      |
| Quantidade                               | TERM-023, TERM-024           | Parcial — planejado vs utilizado                    | DDP-010               |
| Equipamento / Veículo / Máquina / MO     | TERM-025..028                | Aberto — taxonomia                                  | DDP-006..008, DDP-034 |
| Documento / Versão                       | TERM-031..033                | Parcial — modelo lógico×versão×arquivo              | DDP-013               |
| WhatsApp                                 | TERM-036                     | Parcial — CAPABILITY_ONLY                           | DDP-021               |
| Source of Truth                          | TERM-037                     | Aberto                                              | DDP-020               |
| Locação                                  | TERM-038                     | Escopo candidato, não confirmado                    | DDP-026               |
| Aging / Gargalo                          | TERM-039                     | Aberto — sem faixas                                 | DDP-024               |
| Estados ASSIGNED/VIEWED                  | ver state-event              | Aberto                                              | DDP-032               |

## Regra

Nenhuma linha acima promove status a `CONFIRMED`. Resolução definitiva exige fonte primária + decisão em DDP.

## Referência histórica

Registro Prompt 01 preservado: [`../02-source-analysis/ambiguous-terms.md`](../02-source-analysis/ambiguous-terms.md).
