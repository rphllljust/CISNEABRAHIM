# Prompt 43 — Ativos físicos e veículos (backend)

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(resources): implement physical asset registry` |
| **Próximo passo autorizado** | Prompt 44 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Asset ≠ ResourceType | **SIM** — FK para `cat.physical_resource_types`; instância em `ast.physical_assets` |
| Core relacional + extensão tipada | **SIM** — core + `ast.vehicle_profiles` (1:1) somente para classificação `VEHICLE` |
| `lifecycleStatus` ACTIVE/INACTIVE | **SIM** |
| `allocationStatus` AVAILABLE/ALLOCATED | **SIM** — sem lógica temporal de alocação |
| CRUD sem DELETE destrutivo | **SIM** — deactivate/activate |
| Optimistic locking | **SIM** — coluna `version` |
| Unicidade `assetCode` e placa | **SIM** |
| Authz + auditoria | **SIM** — `resources:asset:*` + `security:resources:asset:*` |
| Escopo UNIT para cross-scope | **SIM** |
| Prompt 44 executado | **NÃO** |

## Schema (`0014_physical_assets_baseline.sql`)

| Objeto | Descrição |
| ------ | --------- |
| `ast.physical_assets` | Código, tipo, nome, lifecycle, allocation, unit_id, version |
| `ast.vehicle_profiles` | Placa normalizada/display, chassi, modelo — somente veículos |

## API (`/api/v1/resources/physical-assets`)

| Método | Path | Ação |
| ------ | ---- | ---- |
| POST | `/` | Criar ativo |
| GET | `/` | Listar (filtros: lifecycle, allocation, resourceTypeId) |
| GET | `/:assetId` | Detalhe |
| PATCH | `/:assetId` | Atualizar (version obrigatória) |
| POST | `/:assetId/deactivate` | Desativar |
| POST | `/:assetId/activate` | Reativar |

## Testes

- Integration: veículo, máquina, duplicatas, tipo inativo, stale version, lifecycle, cross-unit scope, DTO leakage, histórico de auditoria
- E2E HTTP: lifecycle anônimo negado + veículo completo
- Persistence: migration `0014`
- Unit: normalização de código e placa

## Quality gate

- [x] lint, typecheck, test:integration, test:e2e — PASS
- [x] Prompt 44 não executado
