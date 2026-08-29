# Auditoria de cobertura

| Campo | Valor |
| --- | --- |
| Document ID | CA-001 |
| Data | 2026-08-28 |

## Por fonte

| Source | Seções lidas | EV geradas | BR vinculadas | Conflitos | Avaliação |
| --- | --- | --- | --- | --- | --- |
| SRC-000 | Governança | 0 operacionais | BR-001..003 (origem) | 0 | Completo para papel de governança |
| SRC-001 | §1–§23 | 84 | BR-001..025 (candidatas) | 0 | Análise atômica COMPLETE para conteúdo disponível |

## Por domínio (resumo)

| Domínio | EV count (aprox.) | Cobertura | Gap crítico |
| --- | --- | --- | --- |
| SERVICE_REQUEST | 9 | PARCIAL | Atores e canais |
| SERVICE_ORDER | 14 | PARCIAL | Estados e tipos |
| COMMERCIAL_CHAIN | 8 | PARCIAL | Cardinalidade |
| PURCHASE_ORDER | 3 | MINIMAL | Saldo e consumo |
| MEASUREMENT | 2 | MINIMAL | Processo inteiro |
| FISCAL | 3 | MINIMAL | Modo emissão |
| LABOR | 5 | PARCIAL | Apontamento |
| EQUIPMENT | 6 | PARCIAL | Cadastro |
| PRICING / BILLING | 10 | PARCIAL | Margem, faturável |
| DOCUMENT | 6 | PARCIAL | Tipologia |
| RESPONSIBILITY / AGING | 7 | PARCIAL | Faixas aging |
| SECURITY | 4 | PARCIAL | Matriz SoD |
| SCOPE | 6 | PARCIAL | Release |
| INTEGRATION | 1 | MINIMAL | Contratos |
| GOVERNANCE | 2 | META | — |

## Quality gates Prompt 01

| Gate | Status |
| --- | --- |
| Pasta `02-source-analysis/` com 28 artefatos não vazios | PASS |
| 70–90 evidências atômicas | PASS (84) |
| 0 regras CONFIRMED novas | PASS |
| SRC-001 marcado analisado no source-registry | PASS (pendente update) |
| DDP e RISK incrementados | PASS (pendente update) |
| Prompt 02 não executado | PASS |
| Código funcional não criado | PASS |

## Itens não cobertos (esperado)

Requisitos fiscais detalhados, SLAs, RPO/RTO numéricos, organograma, RACI nomeado — ausência registrada, não inventada.
