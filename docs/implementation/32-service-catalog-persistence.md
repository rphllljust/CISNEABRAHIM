# Prompt 32 — Persistência versionada do Catálogo de Serviços

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Base Git** | `38cc6ce` (Prompt 31 aprovado) |
| **Migration** | `0007_service_catalog_baseline.sql` |
| **Próximo passo autorizado** | Prompt 33 (não executado nesta entrega) |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Schema `cat` criado | **SIM** |
| Versionamento imutável | **SIM** (trigger + UNIQUE) |
| Tabela por CNAE | **NÃO** |
| JSON sem contrato | **NÃO** (schema_version + tipos TS) |
| EAV indiscriminado | **NÃO** |
| Clients alterado | **NÃO** |
| Prompt 33 executado | **NÃO** |

---

## 1. Objetivo

Persistir o catálogo orientado a `ServiceDefinition` (Prompt 31) em modelo relacional normalizado, versionável e auditável — sem hardcode por CNAE e sem perda de integridade histórica.

---

## 2. Schema PostgreSQL — `cat`

| Tabela | Papel |
| ------ | ----- |
| `service_categories` | Agrupamento administrativo (código estável, soft deactivation) |
| `service_definitions` | Linhagem (`code` único estável) |
| `service_definition_versions` | Publicação versionada imutável após `ACTIVE` |
| `service_legal_classifications` | Referências legais (CNAE/NCM/OTHER) por versão |
| `service_allowed_units` | Unidades permitidas por versão |
| `service_pricing_models` | Modalidades comerciais permitidas (não preço) |
| `service_resource_requirements` | Requisitos de recurso normalizados |
| `service_evidence_requirements` | Requisitos de evidência normalizados |

### 2.1 Enums (sem strings mágicas)

| Enum | Valores |
| ---- | ------- |
| `operational_archetype` | 12 arquétipos do Prompt 31 |
| `service_definition_version_status` | `DRAFT`, `ACTIVE`, `RETIRED` |
| `service_definition_lineage_status` | `ACTIVE`, `INACTIVE` |
| `legal_classification_scheme` | `CNAE`, `NCM`, `OTHER` |
| `measurement_mode` | `BY_PERIOD`, `BY_QUANTITY`, `BY_EVENT`, `CHECKLIST` |
| `pricing_model_code` | `FIXED`, `PER_UNIT`, `PER_PERIOD`, `PER_TRIP`, `TIERED`, `CONTRACT_REFERENCE` |
| `resource_kind` | `VEHICLE`, `OPERATOR`, `EQUIPMENT`, `TEAM`, `OTHER` |
| `evidence_kind` | `PHOTO`, `CHECKLIST`, `SIGNATURE`, `HOUR_METER`, `DOCUMENT`, `OTHER` |
| `requirement_level` | `REQUIRED`, `OPTIONAL` |

### 2.2 Colunas JSONB com contrato explícito

Somente em `service_definition_versions` e linhas filhas opcionais:

| Coluna | Contrato TypeScript | Uso |
| ------ | ------------------- | --- |
| `measurement_config` | `CatalogMeasurementConfigV1` | Parâmetros variáveis de medição |
| `execution_config` | `CatalogExecutionConfigV1` | Campos de execução parametrizáveis |
| `commercial_config` | `CatalogCommercialConfigV1` | Requisitos comerciais parametrizáveis |
| `config` (pricing/resource/evidence) | `Catalog*ConfigV1` | Metadados opcionais por linha |

Arquivo: `packages/database/src/schema/catalog-json-contracts.ts`

Cada coluna JSONB possui coluna irmã `*_schema_version` (CHECK `>= 1`).

---

## 3. Modelo de versionamento

```text
service_definitions (linhagem, code único)
        │
        │ 1:N
        ▼
service_definition_versions (version >= 1, UNIQUE(definition_id, version))
        │
        │ 1:N filhos imutáveis após publicação
        ├── service_legal_classifications
        ├── service_allowed_units
        ├── service_pricing_models
        ├── service_resource_requirements
        └── service_evidence_requirements
```

### Regras

1. **`code`** único em `service_definitions` — identidade estável de negócio.
2. **`version`** inteiro `>= 1`; UNIQUE `(service_definition_id, version)`.
3. Versão **`ACTIVE`/`RETIRED`** não pode ter payload semântico alterado (trigger `service_definition_versions_immutability_trg`).
4. Mudança semântica → **nova linha** `version = N+1` (tipicamente `DRAFT` → publicação).
5. Retirada: transição `ACTIVE` → `RETIRED` com `retired_at` / `retired_by_identity_id`.
6. OS futura referenciará `service_definition_version_id` + snapshot (Prompt posterior).

### CHECKs de consistência

- `DRAFT`: sem `published_at` / `published_by_identity_id`.
- `ACTIVE`/`RETIRED`: `published_at` e `published_by` obrigatórios.
- `RETIRED`: `retired_at` e `retired_by` obrigatórios.

---

## 4. CNAE ↔ catálogo

- Tabela `service_legal_classifications` — **referência**, não motor fiscal.
- CHECK CNAE: `^[0-9]{7}$` quando `scheme = 'CNAE'`.
- UNIQUE `(version_id, scheme, code)` — mesmo CNAE pode mapear N definições via linhas distintas.

---

## 5. Índices principais

| Índice | Motivo |
| ------ | ------ |
| `service_definitions_code_uidx` | Lookup por código estável |
| `service_definition_versions_definition_version_uidx` | Integridade de versionamento |
| `service_definition_versions_definition_status_idx` | Versão ativa por linhagem |
| `service_legal_classifications_scheme_code_idx` | Busca reversa CNAE → versões |
| `service_allowed_units_one_default_per_version_uidx` | Um default por versão |
| UNIQUEs em filhos `(version_id, …)` | Evitar duplicidade semântica |

---

## 6. Atores e soft deactivation

| Entidade | Campos de ator | Soft off |
| -------- | -------------- | -------- |
| `service_categories` | `created_by`, `updated_by`, `deactivated_by` | `status INACTIVE` + `deactivated_at` |
| `service_definitions` | `created_by`, `updated_by`, `deactivated_by` | `status INACTIVE` + `deactivated_at` + `deactivation_reason` |
| `service_definition_versions` | `created_by`, `updated_by`, `published_by`, `retired_by` | `RETIRED` (versão) |

FKs para `identity.identities` com `ON DELETE RESTRICT`.

---

## 7. Artefatos entregues

| Artefato | Caminho |
| -------- | ------- |
| Migration SQL | `packages/database/migrations/0007_service_catalog_baseline.sql` |
| Drizzle schema | `packages/database/src/schema/service-catalog.ts` |
| Contratos JSON | `packages/database/src/schema/catalog-json-contracts.ts` |
| Test builders | `packages/database/src/test-builders/catalog-builders.ts` |
| Testes integração | `packages/database/src/service-catalog.persistence.integration.spec.ts` |

---

## 8. Testes de migration (evidência)

| Cenário | Arquivo / teste |
| ------- | ---------------- |
| Banco vazio / compatível | `applies service catalog migration on empty-compatible database` |
| Migration incremental | `upgrades incrementally without destroying existing identity data` |
| Duplicidade de `code` | `rejects duplicate service definition code` |
| Versionamento | `enforces version uniqueness` + `allows semantic evolution via new version rows` |
| FK inválida | `rejects invalid foreign key references` |
| Rollback transacional | `rolls back catalog inserts transactionally` |
| Imutabilidade publicada | `prevents silent overwrite of published service definition versions` |
| Filhos por versão | `persists child rows bound to the correct version` |

---

## 9. Fora de escopo (Prompt 32)

- API REST / serviços de aplicação
- Seeds de catálogo empresarial
- Snapshot em OS (`service_orders` ainda inexistente)
- `ref.unit_of_measure` lookup global (DM-QTY-001 — hipótese futura)
- Prompt 33

---

## 10. Quality gate

- [x] Migration `0007` forward-only
- [x] 8 tabelas + enums + trigger de imutabilidade
- [x] UUID, FKs, CHECKs, índices
- [x] Testes integração catálogo
- [x] Clients inalterado
- [x] `pnpm lint` — PASS
- [x] `pnpm typecheck` — PASS
- [x] `pnpm test` — PASS
- [x] `pnpm test:integration` — PASS
- [x] `pnpm build` — PASS
- [x] `pnpm gate:src-002` — PASS
- [x] Prompt 33 não executado

---

## Referências

- [`31-service-catalog-domain.md`](./31-service-catalog-domain.md)
- [`migration-workflow.md`](../18-database-foundation/migration-workflow.md)
- [`quantity-and-unit-policy.md`](../13-data-model/quantity-and-unit-policy.md)
