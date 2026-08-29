# Prompt 41 — Seed canônico do portfólio de serviços CISNE

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(catalog): seed complete Cisne service portfolio` |
| **Próximo passo autorizado** | Prompt 43 (via Prompt 42) |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| 49 atividades CNAE cadastradas | **SIM** |
| CNAE como referência legal | **SIM** — `service_legal_classifications`; não é workflow |
| Arquétipos operacionais válidos | **SIM** — mapeamento técnico por vertical |
| Idempotência | **SIM** — segunda execução não cria novas versões |
| Preços / impostos / requisitos inventados | **NÃO** |
| Versões publicadas (v1 ACTIVE) | **SIM** — estratégia de baseline canônico |
| Prompt 42 executado | **NÃO** |

## Estrutura

| Artefato | Descrição |
| -------- | --------- |
| `cisne-service-portfolio-data.ts` | 49 entradas CNAE + arquétipo + nome |
| `cisne-service-portfolio-baseline.ts` | Seed idempotente |
| `cnae-code.ts` | Normalização `46.19-2-00` → `4619200` |
| `catalog-baseline-actor.ts` | Identidade técnica estável para seeds de catálogo |

Cada atividade gera:

- `ServiceDefinition` com código `CNAE-{7dígitos}`
- Versão `1` publicada (`ACTIVE`)
- Classificação legal CNAE na versão
- Categoria `CISNE-PORTFOLIO`

Sem `pricingModels`, `resourceRequirements`, `laborRequirements` ou `executionRequirements`.

## Mapeamento (exemplos)

| CNAE | Atividade | Arquétipo |
| ---- | --------- | --------- |
| 43.13-4-00 | Terraplenagem | `CIVIL_WORK` |
| 77.11-0-00 | Locação de automóveis | `RENTAL` |
| 49.30-2-01 | Transporte de carga municipal | `TRANSPORT` |
| 25.39-0-01 | Usinagem/tornearia/solda | `INDUSTRIAL_SERVICE` |
| 46.19-2-00 | Representação comercial | `COMMERCIAL_REPRESENTATION` |
| 38.11-4-00 | Coleta de resíduos | `WASTE_SERVICE` |
| 50.30-1-01 | Apoio marítimo | `MARITIME_SUPPORT` |
| 45.11-1-01 | Varejo de veículos | `GOODS_TRADE` |

## Comandos

```powershell
pnpm db:seed:portfolio
# ou via dev seed (também idempotente):
pnpm db:seed:dev
```

## Quality gate

- [x] todos os CNAEs esperados (49)
- [x] codes únicos e sem duplicidade CNAE
- [x] archetypes válidos
- [x] seed repetido idempotente
- [x] versões publicadas v1
- [x] sem regra fiscal inventada
- [x] lint, typecheck, test, test:integration, gate:database — PASS
