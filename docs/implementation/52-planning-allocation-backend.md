# Prompt 52 — Planejamento, alocação e disponibilidade (backend)

## Escopo

Separação explícita:

| Conceito | Representação |
|----------|----------------|
| Service requirement | `service_snapshot.requirements` (imutável após release) |
| Planned resource | `so.planned_resources` (tipo + quantidade) |
| Allocated resource | `res.resource_allocations` (asset + intervalo) |
| Actual resource | Fora do escopo deste prompt (execução) |

## Planejamento

Trabalha com `ResourceType` (`PHYSICAL_RESOURCE`) e `LaborType` (`LABOR`) sem exigir asset/employee concreto.

**API:**

| Método | Rota |
|--------|------|
| `GET` | `/api/v1/service-orders/:id/planned-resources` |
| `POST` | `/api/v1/service-orders/:id/planned-resources` |
| `PATCH` | `/api/v1/service-orders/:id/planned-resources/:plannedResourceId` |
| `POST` | `/api/v1/service-orders/:id/planned-resources/:plannedResourceId/remove` |

OS deve estar em `RELEASED` ou `IN_EXECUTION`. Tipos validados contra `service_snapshot.requirements`.

**Alocação de mão de obra:** planejamento por `laborTypeCode` permitido; alocação a employee **não implementada** (módulo HR inexistente).

## Alocação

Resolve `ResourceType` → `PhysicalAsset` com intervalo `[operationalStart, operationalEnd)` (semiaberto).

| Método | Rota |
|--------|------|
| `GET` | `/api/v1/service-orders/:id/allocations` |
| `POST` | `/api/v1/service-orders/:id/allocations` |
| `POST` | `/api/v1/service-orders/:id/allocations/:allocationId/reallocate` |
| `POST` | `/api/v1/service-orders/:id/allocations/:allocationId/remove` |

## Disponibilidade

Não é coluna estática. Resultado de:

- Asset `lifecycle_status = ACTIVE`
- Intervalo solicitado
- Alocações `ACTIVE` existentes
- (Bloqueios operacionais: reservado para prompt futuro)

## Concorrência

**Estratégia:** transação + `SELECT ... FOR UPDATE` no asset + **exclusion constraint GiST** em `(physical_asset_id, operational_period)` para status `ACTIVE`.

```sql
EXCLUDE USING gist (physical_asset_id WITH =, operational_period WITH &&)
WHERE (status = 'ACTIVE')
```

Intervalos semiabertos `[start, end)`: `08:00–10:00` e `10:00–12:00` **não** conflitam.

Justificativa: o exclusion constraint garante atomicidade no commit mesmo com duas transações concorrentes que passaram por SELECT prévio — evita check-then-act ingênuo (TXN-EXCL-001).

## Compatibilidade

Asset alocado deve ter `resource_type_code` igual ao planejado e presente em `service_snapshot.requirements.resources`.

## Histórico e auditoria

- `res.resource_allocation_history_events`: `ALLOCATE_RESOURCE`, `REALLOCATE_RESOURCE`, `REMOVE_ALLOCATION`
- `audit.security_audit_events`: plan, allocate, reallocate, remove

Remoção usa status `REMOVED`/`REALLOCATED` — sem DELETE silencioso.

## Migração

`0021_planning_allocation_baseline.sql` — `so.planned_resources`, `res.resource_allocations`, history, índices em `service_order_id` e `physical_asset_id`.

## Testes

```bash
cd apps/api
npx vitest run src/service-orders/domain/resource-*.spec.ts
npx vitest run --config vitest.integration.config.ts src/service-orders/service-order-planning.integration.spec.ts
```

Cobertura: planejamento, alocação, asset inativo, tipo incompatível, janela planejada, intervalos adjacentes, concorrência real, authz/IDOR, version conflict, histórico preservado.
