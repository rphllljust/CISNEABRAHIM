# Prompt 37 — Catálogo de tipos de recursos físicos

## Objetivo

Separar rigorosamente **ServiceDefinition** ≠ **ResourceType** ≠ **Physical Asset** (ativo concreto fica fora deste prompt).

## Entregas

### Migration `0010_physical_resource_types.sql`

- Enum `physical_resource_classification`: VEHICLE, MACHINE, EQUIPMENT, CONSUMABLE, MATERIAL
- Enum `physical_resource_type_status`: ACTIVE, INACTIVE
- Tabela `cat.physical_resource_types` com code único, classification, status, version (optimistic locking)
- Seed idempotente dos 17 tipos iniciais (CAR, TRUCK, WATER_TRUCK, …, OTHER)
- `requirement_level` estendido com `CONDITIONAL`
- `cat.service_resource_requirements` migrado de `resource_kind` para `physical_resource_type_code` (FK)

### Módulo `apps/api/src/resources/`

- API: `GET/POST/PATCH /api/v1/resources/physical-resource-types`
- Transições: activate / deactivate com version
- Authz: `resources:resource-type:*`
- Audit: `security:resources:resource-type:*`

### Integração com catálogo de serviços

- `resourceRequirements` em create/update draft/create version (níveis REQUIRED, OPTIONAL, CONDITIONAL + minQuantity)
- Validação de tipo ativo no boundary; versões publicadas preservam requirements históricos
- Resposta de versão inclui `resourceRequirements`

## Quality gates

- duplicate type, association, incompatibilidade (tipo desconhecido/inativo), versioning, authorization, concurrency, API — cobertos em integration/e2e

## Próximo prompt permitido

38 (mão de obra) — **não executado**
