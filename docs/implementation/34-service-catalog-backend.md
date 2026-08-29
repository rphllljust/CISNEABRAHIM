# Prompt 34 — Catálogo de serviços: backend, domínio e API

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Base Git** | `3ae7349` (Prompt 33 aprovado) |
| **Tipo** | Domínio + API administrativa versionada |
| **Próximo passo autorizado** | Prompt 35 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Agregado `ServiceDefinition` + versões | **SIM** |
| Estados DRAFT / PUBLISHED / INACTIVE | **SIM** |
| Imutabilidade de versão publicada | **SIM** (domínio + trigger DB Prompt 32) |
| Comandos explícitos (sem PATCH genérico de status) | **SIM** |
| Autorização via PDP + grants globais | **SIM** |
| Concorrência otimista (`VERSION_CONFLICT`) | **SIM** |
| Auditoria de mutações | **SIM** |
| DTOs explícitos (sem vazamento ORM) | **SIM** |
| Prompt 35 executado | **NÃO** |

---

## 1. Princípios preservados

| Separação | Implementação |
| --------- | ------------- |
| CNAE ≠ ServiceDefinition | Código de serviço (`code`) é identidade lógica estável; CNAE não modelado neste prompt |
| ServiceDefinition ≠ ServiceOrder / Asset / Price | Apenas definição versionada + unidades permitidas; sem OS, ativo ou preço |

Identidade lógica (`code`, ex.: `LOCACAO_CAMINHAO_PIPA`) é distinta do número de versão (`version` 1, 2, 3…).

---

## 2. Persistência

Reutiliza schema `cat` do Prompt 32. Migration `0008` adiciona coluna `version` em `cat.service_definitions` para **optimistic locking da linhagem** (análogo a `pty.clients`).

| Camada | Tabela / campo | Papel |
| ------ | -------------- | ----- |
| Linhagem | `cat.service_definitions` | `code` único, status ACTIVE/INACTIVE, `version` para concorrência |
| Versão | `cat.service_definition_versions` | payload versionado; status DB DRAFT/ACTIVE/RETIRED |
| API | status de versão | `DRAFT` / `PUBLISHED` / `RETIRED` (ACTIVE → PUBLISHED) |

---

## 3. Módulo `apps/api/src/catalog/`

| Componente | Responsabilidade |
| ---------- | ---------------- |
| `ServiceDefinitionsController` | HTTP `/api/v1/catalog/service-definitions` |
| `ServiceCatalogAccessService` | Comandos, queries, PDP, auditoria |
| `ServiceCatalogRepository` | SQL transacional sobre schema `cat` |
| DTOs / serializers | Entrada validada; saída camelCase |
| `CatalogExceptionFilter` | Contrato `{ error: { code, message } }` |

### Comandos

- `CreateServiceDefinition` — linhagem + versão 1 DRAFT
- `CreateServiceDefinitionVersion` — nova versão DRAFT (opcional `sourceVersion`)
- `UpdateDraftServiceDefinition` — somente DRAFT
- `PublishServiceDefinitionVersion` — transacional; valida code, name, category, archetype, unidades
- `DeactivateServiceDefinition` / `ActivateServiceDefinition` — linhagem com `lineageVersion`

### Queries

- `GetServiceDefinition`, `ListServiceDefinitions`
- `GetServiceDefinitionVersion`, `ListServiceDefinitionVersions`

---

## 4. API

| Método | Rota |
| ------ | ---- |
| POST | `/api/v1/catalog/service-definitions` |
| GET | `/api/v1/catalog/service-definitions` |
| GET | `/api/v1/catalog/service-definitions/:definitionId` |
| POST | `/api/v1/catalog/service-definitions/:definitionId/deactivate` |
| POST | `/api/v1/catalog/service-definitions/:definitionId/activate` |
| POST | `/api/v1/catalog/service-definitions/:definitionId/versions` |
| GET | `/api/v1/catalog/service-definitions/:definitionId/versions` |
| GET | `/api/v1/catalog/service-definitions/:definitionId/versions/:versionNumber` |
| PATCH | `/api/v1/catalog/service-definitions/:definitionId/versions/:versionNumber` |
| POST | `/api/v1/catalog/service-definitions/:definitionId/versions/:versionNumber/publish` |

Listagem paginada: `{ items, limit, offset }`.

---

## 5. Autorização

Capabilities (grants globais obrigatórios para mutação/leitura individual):

| Action | Capability |
| ------ | ---------- |
| create | `catalog:service:create` |
| read | `catalog:service:read` |
| list | `catalog:service:list` |
| update | `catalog:service:update` |
| publish | `catalog:service:publish` |
| deactivate | `catalog:service:deactivate` |
| activate | `catalog:service:activate` |

Frontend não é autoridade; decisão no PDP + verificação de escopo `GLOBAL`.

---

## 6. Auditoria

Eventos registrados em mutações: `CREATE`, `UPDATE_DRAFT`, `CREATE_VERSION`, `PUBLISH`, `DEACTIVATE`, `ACTIVATE` com actor, resource e metadata.

---

## 7. Testes

| Suíte | Escopo |
| ----- | ------ |
| `service-catalog.validation.spec.ts` | Validação de domínio |
| `service-catalog.integration.spec.ts` | Ciclo completo, duplicidade, imutabilidade, publish inválido, concorrência, authz, IDOR, paginação |
| `service-catalog.e2e.spec.ts` | HTTP anônimo negado + lifecycle |

---

## 8. Arquivos principais

- `packages/database/migrations/0008_service_definitions_lineage_version.sql`
- `apps/api/src/catalog/**`
- `apps/api/src/app.module.ts`, `apps/api/src/main.ts`
- `apps/api/src/test/ensure-migrations.ts`
- `packages/database/scripts/ci-database-gate.mjs`

---

## 9. Fora de escopo (Prompts 35–40)

Classificações legais (CNAE), modelos de preço, requisitos de recurso/evidência avançados e integração operacional com OS não são exigidos na publicação neste prompt.
