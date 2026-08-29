# Prompt 40 — Requisitos de execução e evidências tipadas

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(catalog): implement typed execution requirements` |
| **Próximo passo autorizado** | Prompt 41 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Tipos aprovados de evidência | **SIM** — 13 tipos expostos na API (`PHOTO`, `DOCUMENT`, `SIGNATURE`, `START_TIME`, `END_TIME`, `LOCATION`, `MILEAGE`, `HOUR_METER`, `QUANTITY`, `WEIGHT`, `VOLUME`, `RECEIPT`, `OBSERVATION`) |
| Obrigatoriedade | **SIM** — `REQUIRED`, `OPTIONAL`, `CONDITIONAL` |
| Condições tipadas | **SIM** — `WHEN_MEASUREMENT_BASIS_IS`, `WHEN_ARCHETYPE_IS`, `WHEN_RESOURCE_TYPE_IS`, `WHEN_LABOR_TYPE_IS` |
| Motor de expressão aberto | **NÃO** — proibido `eval`, JS/SQL/template/engine; chaves proibidas rejeitadas no backend |
| Formulário arbitrário executável | **NÃO** |
| Versionamento por `ServiceDefinition` | **SIM** — requirements pertencem à versão; histórico publicado imutável |
| Schema JSONB explícito | **SIM** — `CatalogExecutionRequirementConfigV1` com `schemaVersion: 1` |
| Prompt 41 executado | **NÃO** |

## Persistência

Reutiliza `cat.service_evidence_requirements`:

| API | Coluna SQL |
| --- | ---------- |
| `executionRequirements[]` | linhas em `service_evidence_requirements` |
| `requirementType` | `evidence_kind` (enum estendido) |
| `requirementLevel` | `requirement_level` |
| `config` | `config` (JSONB validado) |

Migration `0013_execution_requirements.sql` adiciona valores ao enum `cat.evidence_kind` (`START_TIME`, `END_TIME`, `LOCATION`, `MILEAGE`, `QUANTITY`, `WEIGHT`, `VOLUME`, `RECEIPT`, `OBSERVATION`). Valores legados `CHECKLIST` e `OTHER` permanecem no banco mas não são expostos na API.

## Contrato de configuração (`CatalogExecutionRequirementConfigV1`)

```json
{
  "schemaVersion": 1,
  "notes": "opcional, máx. 500 caracteres",
  "conditional": {
    "conditionType": "WHEN_MEASUREMENT_BASIS_IS",
    "measurementBasis": "TRIP"
  }
}
```

Chaves rejeitadas em qualquer nível: `expression`, `script`, `eval`, `sql`, `template`, `engine`, `javascript`, `metadata`, `fields`.

## Service catalog

`POST` / `PATCH` de definições aceita `executionRequirements[]`. Nova versão copia requirements da versão fonte publicada quando o payload envia lista vazia (mesmo padrão de `pricingModels`).

## Testes cobertos

- required e optional
- conditional permitido (`WHEN_MEASUREMENT_BASIS_IS`)
- condição desconhecida (`UNKNOWN_CONDITION_TYPE`)
- payload inválido (chave proibida em `config`)
- versionamento (cópia em nova versão; versão publicada preservada)
- published immutability
- authorization (capability `catalog:service-definition:write`)

## Quality gate

- [x] required / optional / conditional
- [x] condição desconhecida rejeitada
- [x] payload inválido rejeitado
- [x] versionamento e imutabilidade publicada
- [x] segurança (sem expression engine)
- [x] lint, typecheck, test, test:integration, test:e2e, gate:database — PASS
