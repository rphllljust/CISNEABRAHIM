import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { ASSET_LIFECYCLE_STATUSES } from '../../resources/domain/physical-asset';
import {
  ALLOCATION_HISTORY_EVENTS,
  PLANNED_RESOURCE_STATUSES,
  RESOURCE_ALLOCATION_STATUSES,
} from '../domain/resource-planning';
import type {
  AllocateResourcePersistenceInput,
  AllocateResourcePersistenceResult,
  CreatePlannedResourcePersistenceInput,
  PhysicalAssetAllocationContext,
  PlannedResourceRow,
  ReallocateResourcePersistenceInput,
  RemoveAllocationPersistenceInput,
  RemovePlannedResourcePersistenceInput,
  ResourceAllocationHistoryEventRow,
  ResourceAllocationRow,
  UpdatePlannedResourcePersistenceInput,
} from './resource-planning.repository.types';

const PLANNED_SELECT = `
  SELECT
    id, service_order_id, requirement_kind::text AS requirement_kind,
    resource_type_code, labor_type_code, planned_quantity::text AS planned_quantity,
    operational_start, operational_end, notes, status::text AS status,
    row_version, created_at, updated_at, created_by_identity_id, updated_by_identity_id
  FROM so.planned_resources
`;

const ALLOCATION_RETURNING = `
  id, service_order_id, planned_resource_id, physical_asset_id, resource_type_code,
  operational_start, operational_end, status::text AS status, row_version,
  allocated_at, allocated_by_identity_id, removed_at, removed_by_identity_id,
  reallocated_to_allocation_id, created_at, updated_at
`;

const ALLOCATION_SELECT = `
  SELECT ${ALLOCATION_RETURNING}
  FROM res.resource_allocations
`;

@Injectable()
export class ResourcePlanningRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async listPlannedResources(serviceOrderId: string): Promise<PlannedResourceRow[]> {
    const result = await this.pool().query<PlannedResourceRow>(
      `${PLANNED_SELECT}
       WHERE service_order_id = $1 AND status = $2::so.planned_resource_status
       ORDER BY created_at ASC, id ASC`,
      [serviceOrderId, PLANNED_RESOURCE_STATUSES.Planned],
    );
    return result.rows;
  }

  async listAllocations(serviceOrderId: string): Promise<ResourceAllocationRow[]> {
    const result = await this.pool().query<ResourceAllocationRow>(
      `${ALLOCATION_SELECT}
       WHERE service_order_id = $1
       ORDER BY allocated_at ASC, id ASC`,
      [serviceOrderId],
    );
    return result.rows;
  }

  async findPlannedResourceById(
    plannedResourceId: string,
    serviceOrderId: string,
  ): Promise<PlannedResourceRow | null> {
    const result = await this.pool().query<PlannedResourceRow>(
      `${PLANNED_SELECT} WHERE id = $1 AND service_order_id = $2`,
      [plannedResourceId, serviceOrderId],
    );
    return result.rows[0] ?? null;
  }

  async findAllocationById(
    allocationId: string,
    serviceOrderId: string,
  ): Promise<ResourceAllocationRow | null> {
    const result = await this.pool().query<ResourceAllocationRow>(
      `${ALLOCATION_SELECT} WHERE id = $1 AND service_order_id = $2`,
      [allocationId, serviceOrderId],
    );
    return result.rows[0] ?? null;
  }

  async listAllocationHistory(allocationId: string): Promise<ResourceAllocationHistoryEventRow[]> {
    const result = await this.pool().query<ResourceAllocationHistoryEventRow>(
      `SELECT id, resource_allocation_id, event_type, payload, actor_identity_id, occurred_at
       FROM res.resource_allocation_history_events
       WHERE resource_allocation_id = $1
       ORDER BY occurred_at ASC, id ASC`,
      [allocationId],
    );
    return result.rows;
  }

  async createPlannedResource(input: CreatePlannedResourcePersistenceInput): Promise<PlannedResourceRow> {
    const result = await this.pool().query<PlannedResourceRow>(
      `INSERT INTO so.planned_resources (
         service_order_id, requirement_kind, resource_type_code, labor_type_code,
         planned_quantity, operational_start, operational_end, notes,
         created_by_identity_id, updated_by_identity_id
       )
       VALUES ($1, $2::so.planned_resource_kind, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING
         id, service_order_id, requirement_kind::text AS requirement_kind,
         resource_type_code, labor_type_code, planned_quantity::text AS planned_quantity,
         operational_start, operational_end, notes, status::text AS status,
         row_version, created_at, updated_at, created_by_identity_id, updated_by_identity_id`,
      [
        input.serviceOrderId,
        input.requirementKind,
        input.resourceTypeCode ?? null,
        input.laborTypeCode ?? null,
        input.plannedQuantity,
        input.operationalStart ?? null,
        input.operationalEnd ?? null,
        input.notes ?? null,
        input.actorIdentityId,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('PLANNED_RESOURCE_INSERT_FAILED');
    }
    return row;
  }

  async updatePlannedResource(
    input: UpdatePlannedResourcePersistenceInput,
  ): Promise<PlannedResourceRow | 'VERSION_CONFLICT' | 'INVALID_STATE'> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query<PlannedResourceRow>(
        `${PLANNED_SELECT} WHERE id = $1 AND service_order_id = $2 FOR UPDATE`,
        [input.plannedResourceId, input.serviceOrderId],
      );
      const current = locked.rows[0];
      if (!current || current.status !== PLANNED_RESOURCE_STATUSES.Planned) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }
      if (current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      const result = await client.query<PlannedResourceRow>(
        `UPDATE so.planned_resources
         SET
           planned_quantity = COALESCE($4::numeric, planned_quantity),
           operational_start = CASE WHEN $5::text = '__UNSET__' THEN operational_start ELSE $5::timestamptz END,
           operational_end = CASE WHEN $6::text = '__UNSET__' THEN operational_end ELSE $6::timestamptz END,
           notes = CASE WHEN $7::text = '__UNSET__' THEN notes ELSE $7 END,
           updated_by_identity_id = $3,
           updated_at = NOW(),
           row_version = row_version + 1
         WHERE id = $1 AND service_order_id = $2 AND row_version = $8
         RETURNING
           id, service_order_id, requirement_kind::text AS requirement_kind,
           resource_type_code, labor_type_code, planned_quantity::text AS planned_quantity,
           operational_start, operational_end, notes, status::text AS status,
           row_version, created_at, updated_at, created_by_identity_id, updated_by_identity_id`,
        [
          input.plannedResourceId,
          input.serviceOrderId,
          input.actorIdentityId,
          input.plannedQuantity ?? null,
          input.operationalStart === undefined ? '__UNSET__' : input.operationalStart,
          input.operationalEnd === undefined ? '__UNSET__' : input.operationalEnd,
          input.notes === undefined ? '__UNSET__' : input.notes,
          input.rowVersion,
        ],
      );
      const updated = result.rows[0];
      if (!updated) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async removePlannedResource(
    input: RemovePlannedResourcePersistenceInput,
  ): Promise<PlannedResourceRow | 'VERSION_CONFLICT' | 'INVALID_STATE'> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query<PlannedResourceRow>(
        `${PLANNED_SELECT} WHERE id = $1 AND service_order_id = $2 FOR UPDATE`,
        [input.plannedResourceId, input.serviceOrderId],
      );
      const current = locked.rows[0];
      if (!current || current.status !== PLANNED_RESOURCE_STATUSES.Planned) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }
      if (current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      const activeAllocations = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM res.resource_allocations
         WHERE planned_resource_id = $1 AND status = $2::res.resource_allocation_status`,
        [input.plannedResourceId, RESOURCE_ALLOCATION_STATUSES.Active],
      );
      if (Number(activeAllocations.rows[0]?.count ?? '0') > 0) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }

      const result = await client.query<PlannedResourceRow>(
        `UPDATE so.planned_resources
         SET status = $4::so.planned_resource_status,
             updated_by_identity_id = $3,
             updated_at = NOW(),
             row_version = row_version + 1
         WHERE id = $1 AND service_order_id = $2 AND row_version = $5
         RETURNING
           id, service_order_id, requirement_kind::text AS requirement_kind,
           resource_type_code, labor_type_code, planned_quantity::text AS planned_quantity,
           operational_start, operational_end, notes, status::text AS status,
           row_version, created_at, updated_at, created_by_identity_id, updated_by_identity_id`,
        [
          input.plannedResourceId,
          input.serviceOrderId,
          input.actorIdentityId,
          PLANNED_RESOURCE_STATUSES.Removed,
          input.rowVersion,
        ],
      );
      const updated = result.rows[0];
      if (!updated) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async allocateResource(
    input: AllocateResourcePersistenceInput,
  ): Promise<AllocateResourcePersistenceResult> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      const planned = await client.query<PlannedResourceRow>(
        `${PLANNED_SELECT} WHERE id = $1 AND service_order_id = $2 FOR UPDATE`,
        [input.plannedResourceId, input.serviceOrderId],
      );
      const plannedRow = planned.rows[0];
      if (!plannedRow || plannedRow.status !== PLANNED_RESOURCE_STATUSES.Planned) {
        await client.query('ROLLBACK');
        return { outcome: 'planned_not_found' };
      }
      if (plannedRow.requirement_kind !== 'PHYSICAL_RESOURCE') {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const asset = await this.lockPhysicalAsset(client, input.physicalAssetId);
      if (!asset) {
        await client.query('ROLLBACK');
        return { outcome: 'asset_not_found' };
      }
      if (asset.lifecycle_status !== ASSET_LIFECYCLE_STATUSES.Active) {
        await client.query('ROLLBACK');
        return { outcome: 'asset_inactive' };
      }
      if (asset.resource_type_code !== input.resourceTypeCode) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const inserted = await this.insertAllocation(client, {
        serviceOrderId: input.serviceOrderId,
        plannedResourceId: input.plannedResourceId,
        physicalAssetId: input.physicalAssetId,
        resourceTypeCode: input.resourceTypeCode,
        operationalStart: input.operationalStart,
        operationalEnd: input.operationalEnd,
        actorIdentityId: input.actorIdentityId,
        historyEventType: ALLOCATION_HISTORY_EVENTS.AllocateResource,
        historyPayload: {
          plannedResourceId: input.plannedResourceId,
          physicalAssetId: input.physicalAssetId,
        },
      });
      if (!inserted) {
        await client.query('ROLLBACK');
        return { outcome: 'allocation_conflict' };
      }

      await client.query('COMMIT');
      return { outcome: 'allocated', allocation: inserted };
    } catch (error) {
      await client.query('ROLLBACK');
      if (this.isExclusionViolation(error)) {
        return { outcome: 'allocation_conflict' };
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async reallocateResource(
    input: ReallocateResourcePersistenceInput,
  ): Promise<AllocateResourcePersistenceResult> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      const currentAllocation = await client.query<ResourceAllocationRow>(
        `${ALLOCATION_SELECT} WHERE id = $1 AND service_order_id = $2 FOR UPDATE`,
        [input.allocationId, input.serviceOrderId],
      );
      const current = currentAllocation.rows[0];
      if (!current || current.status !== RESOURCE_ALLOCATION_STATUSES.Active) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }
      if (current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }

      const asset = await this.lockPhysicalAsset(client, input.newPhysicalAssetId);
      if (!asset) {
        await client.query('ROLLBACK');
        return { outcome: 'asset_not_found' };
      }
      if (asset.lifecycle_status !== ASSET_LIFECYCLE_STATUSES.Active) {
        await client.query('ROLLBACK');
        return { outcome: 'asset_inactive' };
      }
      if (asset.resource_type_code !== input.resourceTypeCode) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const newAllocation = await this.insertAllocation(client, {
        serviceOrderId: input.serviceOrderId,
        plannedResourceId: current.planned_resource_id,
        physicalAssetId: input.newPhysicalAssetId,
        resourceTypeCode: input.resourceTypeCode,
        operationalStart: input.operationalStart,
        operationalEnd: input.operationalEnd,
        actorIdentityId: input.actorIdentityId,
        historyEventType: ALLOCATION_HISTORY_EVENTS.ReallocateResource,
        historyPayload: {
          fromAllocationId: input.allocationId,
          physicalAssetId: input.newPhysicalAssetId,
        },
      });
      if (!newAllocation) {
        await client.query('ROLLBACK');
        return { outcome: 'allocation_conflict' };
      }

      const replaced = await client.query<ResourceAllocationRow>(
        `UPDATE res.resource_allocations
         SET status = $3::res.resource_allocation_status,
             removed_at = NOW(),
             removed_by_identity_id = $4,
             reallocated_to_allocation_id = $5,
             updated_at = NOW(),
             row_version = row_version + 1
         WHERE id = $1 AND service_order_id = $2 AND status = $6::res.resource_allocation_status
         RETURNING ${ALLOCATION_RETURNING}`,
        [
          input.allocationId,
          input.serviceOrderId,
          RESOURCE_ALLOCATION_STATUSES.Reallocated,
          input.actorIdentityId,
          newAllocation.id,
          RESOURCE_ALLOCATION_STATUSES.Active,
        ],
      );
      if (!replaced.rows[0]) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }

      await this.insertAllocationHistory(client, {
        allocationId: input.allocationId,
        eventType: ALLOCATION_HISTORY_EVENTS.ReallocateResource,
        payload: { toAllocationId: newAllocation.id },
        actorIdentityId: input.actorIdentityId,
      });

      await client.query('COMMIT');
      return { outcome: 'allocated', allocation: newAllocation };
    } catch (error) {
      await client.query('ROLLBACK');
      if (this.isExclusionViolation(error)) {
        return { outcome: 'allocation_conflict' };
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async removeAllocation(
    input: RemoveAllocationPersistenceInput,
  ): Promise<ResourceAllocationRow | 'VERSION_CONFLICT' | 'INVALID_STATE'> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query<ResourceAllocationRow>(
        `${ALLOCATION_SELECT} WHERE id = $1 AND service_order_id = $2 FOR UPDATE`,
        [input.allocationId, input.serviceOrderId],
      );
      const current = locked.rows[0];
      if (!current || current.status !== RESOURCE_ALLOCATION_STATUSES.Active) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }
      if (current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      const result = await client.query<ResourceAllocationRow>(
        `UPDATE res.resource_allocations
         SET status = $4::res.resource_allocation_status,
             removed_at = NOW(),
             removed_by_identity_id = $3,
             updated_at = NOW(),
             row_version = row_version + 1
         WHERE id = $1 AND service_order_id = $2 AND row_version = $5
         RETURNING ${ALLOCATION_RETURNING}`,
        [
          input.allocationId,
          input.serviceOrderId,
          input.actorIdentityId,
          RESOURCE_ALLOCATION_STATUSES.Removed,
          input.rowVersion,
        ],
      );
      const updated = result.rows[0];
      if (!updated) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      await this.insertAllocationHistory(client, {
        allocationId: updated.id,
        eventType: ALLOCATION_HISTORY_EVENTS.RemoveAllocation,
        payload: {},
        actorIdentityId: input.actorIdentityId,
      });

      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async isAssetAvailable(
    physicalAssetId: string,
    operationalStart: string,
    operationalEnd: string,
    excludeAllocationId?: string,
  ): Promise<boolean> {
    const result = await this.pool().query<{ available: boolean }>(
      `SELECT NOT EXISTS (
         SELECT 1
         FROM res.resource_allocations
         WHERE physical_asset_id = $1
           AND status = $2::res.resource_allocation_status
           AND ($5::uuid IS NULL OR id <> $5::uuid)
           AND operational_period && tstzrange($3::timestamptz, $4::timestamptz, '[)')
       ) AS available`,
      [
        physicalAssetId,
        RESOURCE_ALLOCATION_STATUSES.Active,
        operationalStart,
        operationalEnd,
        excludeAllocationId ?? null,
      ],
    );
    return result.rows[0]?.available === true;
  }

  private async lockPhysicalAsset(
    client: PoolClient,
    assetId: string,
  ): Promise<PhysicalAssetAllocationContext | null> {
    const result = await client.query<PhysicalAssetAllocationContext>(
      `SELECT
         a.id,
         a.asset_code,
         rt.code AS resource_type_code,
         a.lifecycle_status::text AS lifecycle_status,
         a.unit_id
       FROM ast.physical_assets a
       INNER JOIN cat.physical_resource_types rt ON rt.id = a.physical_resource_type_id
       WHERE a.id = $1
       FOR UPDATE`,
      [assetId],
    );
    return result.rows[0] ?? null;
  }

  private async insertAllocation(
    client: PoolClient,
    input: {
      serviceOrderId: string;
      plannedResourceId: string | null;
      physicalAssetId: string;
      resourceTypeCode: string;
      operationalStart: string;
      operationalEnd: string;
      actorIdentityId: string;
      historyEventType: string;
      historyPayload: Record<string, unknown>;
    },
  ): Promise<ResourceAllocationRow | null> {
    try {
      const result = await client.query<ResourceAllocationRow>(
        `INSERT INTO res.resource_allocations (
           service_order_id, planned_resource_id, physical_asset_id, resource_type_code,
           operational_start, operational_end, allocated_by_identity_id
         )
         VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7)
         RETURNING ${ALLOCATION_RETURNING}`,
        [
          input.serviceOrderId,
          input.plannedResourceId,
          input.physicalAssetId,
          input.resourceTypeCode,
          input.operationalStart,
          input.operationalEnd,
          input.actorIdentityId,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      await this.insertAllocationHistory(client, {
        allocationId: row.id,
        eventType: input.historyEventType,
        payload: input.historyPayload,
        actorIdentityId: input.actorIdentityId,
      });
      return row;
    } catch (error) {
      if (this.isExclusionViolation(error)) {
        return null;
      }
      throw error;
    }
  }

  private async insertAllocationHistory(
    client: PoolClient,
    input: {
      allocationId: string;
      eventType: string;
      payload: Record<string, unknown>;
      actorIdentityId: string;
    },
  ): Promise<void> {
    await client.query(
      `INSERT INTO res.resource_allocation_history_events (
         resource_allocation_id, event_type, payload, actor_identity_id
       )
       VALUES ($1, $2, $3::jsonb, $4)`,
      [input.allocationId, input.eventType, JSON.stringify(input.payload), input.actorIdentityId],
    );
  }

  private isExclusionViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const pgError = error as { code?: string; constraint?: string };
    return (
      pgError.code === '23P01' ||
      pgError.constraint === 'resource_allocations_no_overlap_active_excl'
    );
  }
}
