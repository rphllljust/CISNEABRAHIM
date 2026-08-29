# Auditoria de cobertura

| Campo       | Valor                                        |
| ----------- | -------------------------------------------- |
| Document ID | CA-001                                       |
| Data        | 2026-08-28 (Prompt 01); atualizado Prompt 02 |

## Por fonte

| Source  | Seções lidas | EV geradas     | BR vinculadas            | Conflitos | Avaliação                                         |
| ------- | ------------ | -------------- | ------------------------ | --------- | ------------------------------------------------- |
| SRC-000 | Governança   | 0 operacionais | BR-001..003 (origem)     | 0         | Completo para papel de governança                 |
| SRC-001 | §1–§23       | 84             | BR-001..025 (candidatas) | 0         | Análise atômica COMPLETE para conteúdo disponível |

## Por domínio (resumo)

| Domínio                | EV count (aprox.) | Cobertura | Gap crítico       |
| ---------------------- | ----------------- | --------- | ----------------- |
| SERVICE_REQUEST        | 9                 | PARCIAL   | Atores e canais   |
| SERVICE_ORDER          | 14                | PARCIAL   | Estados e tipos   |
| COMMERCIAL_CHAIN       | 8                 | PARCIAL   | Cardinalidade     |
| PURCHASE_ORDER         | 3                 | MINIMAL   | Saldo e consumo   |
| MEASUREMENT            | 2                 | MINIMAL   | Processo inteiro  |
| FISCAL                 | 3                 | MINIMAL   | Modo emissão      |
| LABOR                  | 5                 | PARCIAL   | Apontamento       |
| EQUIPMENT              | 6                 | PARCIAL   | Cadastro          |
| PRICING / BILLING      | 10                | PARCIAL   | Margem, faturável |
| DOCUMENT               | 6                 | PARCIAL   | Tipologia         |
| RESPONSIBILITY / AGING | 7                 | PARCIAL   | Faixas aging      |
| SECURITY               | 4                 | PARCIAL   | Matriz SoD        |
| SCOPE                  | 6                 | PARCIAL   | Release           |
| INTEGRATION            | 1                 | MINIMAL   | Contratos         |
| GOVERNANCE             | 2                 | META      | —                 |

## Quality gates Prompt 01

| Gate                                                    | Status                 |
| ------------------------------------------------------- | ---------------------- |
| Pasta `02-source-analysis/` com 28 artefatos não vazios | PASS                   |
| 70–90 evidências atômicas                               | PASS (84)              |
| 0 regras CONFIRMED novas                                | PASS                   |
| SRC-001 marcado analisado no source-registry            | PASS (pendente update) |
| DDP e RISK incrementados                                | PASS (pendente update) |
| Prompt 02 não executado                                 | PASS                   |

## Prompt 02 — cobertura de requisitos (2026-08-28)

| Métrica                        | Valor                  | Avaliação                                            |
| ------------------------------ | ---------------------- | ---------------------------------------------------- |
| Arquivos em `03-requirements/` | 20                     | PASS (não vazios)                                    |
| FR (FR-001..FR-042)            | 42                     | PASS                                                 |
| UC (UC-001..UC-026)            | 26                     | PASS                                                 |
| AC (AC-001..AC-052)            | 52                     | PASS                                                 |
| VR                             | 22                     | PASS                                                 |
| AUTH-REQ                       | 20                     | PASS                                                 |
| DR                             | 28                     | PASS                                                 |
| DOC-REQ                        | 14                     | PASS                                                 |
| NOTIF-REQ                      | 10                     | PASS                                                 |
| INT-REQ                        | 8                      | PASS                                                 |
| RPT-REQ                        | 12                     | PASS                                                 |
| EX                             | 18                     | PASS                                                 |
| RQ-QUESTION                    | 25                     | PASS                                                 |
| Capacidades (CAP)              | 27                     | PASS                                                 |
| EV utilizadas em FRs           | 54 de 84               | PASS (30 EV sem FR direto — meta/organização/escopo) |
| BR CONFIRMED                   | 0                      | PASS                                                 |
| Código funcional               | 0                      | PASS                                                 |
| Quality gate Prompt 02         | PASS_WITH_RESTRICTIONS | Sem fontes primárias                                 |

## Itens não cobertos (esperado)

Requisitos fiscais detalhados, SLAs, RPO/RTO numéricos, organograma, RACI nomeado — ausência registrada, não inventada.
