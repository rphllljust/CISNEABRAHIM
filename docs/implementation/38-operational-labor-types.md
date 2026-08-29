# Prompt 38 — Tipos de mão de obra e capacidades operacionais

## Objetivo

Separar **LaborType** ≠ **Employee** ≠ **LaborAssignment** ≠ **User**.

## Entregas

### Migration `0011_operational_labor_types.sql`

- Tabela `cat.operational_labor_types` (code, name, status, version)
- Seed: DRIVER, OPERATOR, HELPER, ELECTRICIAN, WELDER, TECHNICIAN, INSTALLER, CONSTRUCTION_WORKER, SUPERVISOR, OTHER
- Tabela `cat.service_labor_requirements` com FK para labor type e versão de serviço

### API

- `GET/POST/PATCH /api/v1/resources/labor-types`
- Authz: `resources:labor-type:*`
- Sem RH, folha, ponto, recrutamento ou vínculo com pessoa

### Catálogo de serviços

- Campo `laborRequirements` (REQUIRED/OPTIONAL/CONDITIONAL + minQuantity)
- Histórico preservado em versões publicadas

## Próximo prompt permitido

39 — **não executado**
