import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { LineageStatus } from '../domain/service-catalog-status';
import type { AllowedUnitInput } from '../domain/service-catalog.validation';
import type {
  AllowedUnitRow,
  ServiceDefinitionRow,
  ServiceDefinitionSummary,
  ServiceDefinitionVersionDetail,
  ServiceDefinitionVersionRow,
} from '../serializers/service-catalog-response.serializer';

export type CreateDefinitionWithDraftInput = {
  code: string;
  name: string;
  categoryId: string;
  archetype: string;
  measurementMode: string;
  description?: string;
  defaultUnitCode?: string;
  allowedUnits: AllowedUnitInput[];
  actorIdentityId: string;
};

export type CreateDraftVersionInput = {
  definitionId: string;
  name: string;
  categoryId: string;
  archetype: string;
  measurementMode: string;
  description?: string;
  defaultUnitCode?: string;
  allowedUnits: AllowedUnitInput[];
  sourceVersion?: number;
  actorIdentityId: string;
};

export type UpdateDraftVersionInput = {
  definitionId: string;
  versionNumber: number;
  expectedLineageVersion: number;
  name: string;
  categoryId: string;
  archetype: string;
  measurementMode: string;
  description?: string | null;
  defaultUnitCode?: string | null;
  allowedUnits: AllowedUnitInput[];
  actorIdentityId: string;
};

@Injectable()
export class ServiceCatalogRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findDefinitionSummary(definitionId: string): Promise<ServiceDefinitionSummary | null> {
    const result = await this.pool().query<ServiceDefinitionSummary>(
      `SELECT d.id,
              d.code,
              d.status,
              d.version,
              d.created_at,
              d.updated_at,
              d.deactivated_at,
              d.deactivation_reason,
              (
                SELECT MAX(v.version)
                FROM cat.service_definition_versions v
                WHERE v.service_definition_id = d.id
                  AND v.status = 'ACTIVE'
              ) AS latest_published_version,
              (
                SELECT MAX(v.version)
                FROM cat.service_definition_versions v
                WHERE v.service_definition_id = d.id
                  AND v.status = 'DRAFT'
              ) AS current_draft_version
       FROM cat.service_definitions d
       WHERE d.id = $1`,
      [definitionId],
    );
    return result.rows[0] ?? null;
  }

  async listDefinitions(
    whereClause: string,
    params: unknown[],
    limit: number,
    offset: number,
  ): Promise<ServiceDefinitionSummary[]> {
    const result = await this.pool().query<ServiceDefinitionSummary>(
      `SELECT d.id,
              d.code,
              d.status,
              d.version,
              d.created_at,
              d.updated_at,
              d.deactivated_at,
              d.deactivation_reason,
              (
                SELECT MAX(v.version)
                FROM cat.service_definition_versions v
                WHERE v.service_definition_id = d.id
                  AND v.status = 'ACTIVE'
              ) AS latest_published_version,
              (
                SELECT MAX(v.version)
                FROM cat.service_definition_versions v
                WHERE v.service_definition_id = d.id
                  AND v.status = 'DRAFT'
              ) AS current_draft_version
       FROM cat.service_definitions d
       WHERE ${whereClause}
       ORDER BY d.created_at ASC, d.id ASC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    return result.rows;
  }

  async findVersionDetail(
    definitionId: string,
    versionNumber: number,
  ): Promise<ServiceDefinitionVersionDetail | null> {
    const version = await this.pool().query<ServiceDefinitionVersionRow & { code: string }>(
      `SELECT v.id,
              v.service_definition_id,
              v.version,
              v.status,
              v.category_id,
              v.archetype,
              v.name,
              v.description,
              v.default_unit_code,
              v.measurement_mode,
              v.published_at,
              v.created_at,
              v.updated_at,
              d.code
       FROM cat.service_definition_versions v
       INNER JOIN cat.service_definitions d ON d.id = v.service_definition_id
       WHERE v.service_definition_id = $1
         AND v.version = $2`,
      [definitionId, versionNumber],
    );
    const row = version.rows[0];
    if (!row) {
      return null;
    }
    const units = await this.pool().query<AllowedUnitRow>(
      `SELECT unit_code, is_default, sort_order
       FROM cat.service_allowed_units
       WHERE service_definition_version_id = $1
       ORDER BY sort_order ASC, unit_code ASC`,
      [row.id],
    );
    return { ...row, allowed_units: units.rows };
  }

  async listVersions(definitionId: string): Promise<ServiceDefinitionVersionRow[]> {
    const result = await this.pool().query<ServiceDefinitionVersionRow>(
      `SELECT id,
              service_definition_id,
              version,
              status,
              category_id,
              archetype,
              name,
              description,
              default_unit_code,
              measurement_mode,
              published_at,
              created_at,
              updated_at
       FROM cat.service_definition_versions
       WHERE service_definition_id = $1
       ORDER BY version ASC`,
      [definitionId],
    );
    return result.rows;
  }

  async createDefinitionWithDraft(
    input: CreateDefinitionWithDraftInput,
  ): Promise<ServiceDefinitionVersionDetail> {
    const pool = this.pool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const definition = await client.query<ServiceDefinitionRow>(
        `INSERT INTO cat.service_definitions (
           code, created_by_identity_id, updated_by_identity_id
         ) VALUES ($1, $2, $2)
         RETURNING id, code, status, version, created_at, updated_at, deactivated_at, deactivation_reason`,
        [input.code, input.actorIdentityId],
      );
      const defRow = definition.rows[0];
      if (!defRow) {
        throw new Error('Failed to create service definition.');
      }

      const version = await client.query<{ id: string }>(
        `INSERT INTO cat.service_definition_versions (
           service_definition_id,
           version,
           status,
           category_id,
           archetype,
           name,
           description,
           default_unit_code,
           measurement_mode,
           created_by_identity_id,
           updated_by_identity_id
         ) VALUES ($1, 1, 'DRAFT', $2, $3, $4, $5, $6, $7, $8, $8)
         RETURNING id`,
        [
          defRow.id,
          input.categoryId,
          input.archetype,
          input.name,
          input.description ?? null,
          input.defaultUnitCode ?? null,
          input.measurementMode,
          input.actorIdentityId,
        ],
      );
      const versionId = version.rows[0]?.id;
      if (!versionId) {
        throw new Error('Failed to create service definition version.');
      }

      await this.replaceAllowedUnits(client, versionId, input.allowedUnits);
      await client.query('COMMIT');

      const detail = await this.findVersionDetail(defRow.id, 1);
      if (!detail) {
        throw new Error('Failed to load created service definition version.');
      }
      return detail;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createDraftVersion(input: CreateDraftVersionInput): Promise<ServiceDefinitionVersionDetail | 'DRAFT_EXISTS'> {
    const pool = this.pool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingDraft = await client.query<{ version: number }>(
        `SELECT version
         FROM cat.service_definition_versions
         WHERE service_definition_id = $1
           AND status = 'DRAFT'
         LIMIT 1`,
        [input.definitionId],
      );
      if ((existingDraft.rowCount ?? 0) > 0) {
        await client.query('ROLLBACK');
        return 'DRAFT_EXISTS';
      }

      const nextVersion = await client.query<{ next_version: number }>(
        `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
         FROM cat.service_definition_versions
         WHERE service_definition_id = $1`,
        [input.definitionId],
      );
      const versionNumber = nextVersion.rows[0]?.next_version ?? 1;

      let payload = input;
      if (input.sourceVersion !== undefined) {
        const source = await this.findVersionDetail(input.definitionId, input.sourceVersion);
        if (!source) {
          await client.query('ROLLBACK');
          return null as never;
        }
        payload = {
          ...input,
          name: input.name || source.name,
          categoryId: input.categoryId || source.category_id,
          archetype: input.archetype || source.archetype,
          measurementMode: input.measurementMode || source.measurement_mode,
          description: input.description ?? source.description ?? undefined,
          defaultUnitCode: input.defaultUnitCode ?? source.default_unit_code ?? undefined,
          allowedUnits:
            input.allowedUnits.length > 0
              ? input.allowedUnits
              : source.allowed_units.map((unit) => ({
                  unitCode: unit.unit_code,
                  isDefault: unit.is_default,
                  sortOrder: unit.sort_order,
                })),
        };
      }

      const version = await client.query<{ id: string }>(
        `INSERT INTO cat.service_definition_versions (
           service_definition_id,
           version,
           status,
           category_id,
           archetype,
           name,
           description,
           default_unit_code,
           measurement_mode,
           created_by_identity_id,
           updated_by_identity_id
         ) VALUES ($1, $2, 'DRAFT', $3, $4, $5, $6, $7, $8, $9, $9)
         RETURNING id`,
        [
          input.definitionId,
          versionNumber,
          payload.categoryId,
          payload.archetype,
          payload.name,
          payload.description ?? null,
          payload.defaultUnitCode ?? null,
          payload.measurementMode,
          input.actorIdentityId,
        ],
      );
      const versionId = version.rows[0]?.id;
      if (!versionId) {
        throw new Error('Failed to create draft version.');
      }

      await this.replaceAllowedUnits(client, versionId, payload.allowedUnits);
      await client.query(
        `UPDATE cat.service_definitions
         SET updated_at = now(), updated_by_identity_id = $2, version = version + 1
         WHERE id = $1`,
        [input.definitionId, input.actorIdentityId],
      );
      await client.query('COMMIT');

      const detail = await this.findVersionDetail(input.definitionId, versionNumber);
      if (!detail) {
        throw new Error('Failed to load created draft version.');
      }
      return detail;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateDraftVersion(
    input: UpdateDraftVersionInput,
  ): Promise<ServiceDefinitionVersionDetail | null | 'VERSION_CONFLICT' | 'NOT_DRAFT' | 'INVALID_STATE'> {
    const pool = this.pool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lineage = await client.query<{ version: number; status: LineageStatus }>(
        `SELECT version, status FROM cat.service_definitions WHERE id = $1 FOR UPDATE`,
        [input.definitionId],
      );
      const lineageRow = lineage.rows[0];
      if (!lineageRow) {
        await client.query('ROLLBACK');
        return null;
      }
      if (lineageRow.status !== 'ACTIVE') {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }
      if (lineageRow.version !== input.expectedLineageVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      const current = await client.query<{ id: string; status: string }>(
        `SELECT id, status
         FROM cat.service_definition_versions
         WHERE service_definition_id = $1
           AND version = $2
         FOR UPDATE`,
        [input.definitionId, input.versionNumber],
      );
      const currentRow = current.rows[0];
      if (!currentRow) {
        await client.query('ROLLBACK');
        return null;
      }
      if (currentRow.status !== 'DRAFT') {
        await client.query('ROLLBACK');
        return 'NOT_DRAFT';
      }

      await client.query(
        `UPDATE cat.service_definition_versions
         SET category_id = $3,
             archetype = $4,
             name = $5,
             description = $6,
             default_unit_code = $7,
             measurement_mode = $8,
             updated_at = now(),
             updated_by_identity_id = $9
         WHERE id = $2
           AND service_definition_id = $1
           AND version = $10
           AND status = 'DRAFT'`,
        [
          input.definitionId,
          currentRow.id,
          input.categoryId,
          input.archetype,
          input.name,
          input.description ?? null,
          input.defaultUnitCode ?? null,
          input.measurementMode,
          input.actorIdentityId,
          input.versionNumber,
        ],
      );

      await this.replaceAllowedUnits(client, currentRow.id, input.allowedUnits);

      const lineageUpdated = await client.query(
        `UPDATE cat.service_definitions
         SET updated_at = now(),
             updated_by_identity_id = $2,
             version = version + 1
         WHERE id = $1
           AND version = $3`,
        [input.definitionId, input.actorIdentityId, input.expectedLineageVersion],
      );
      if (lineageUpdated.rowCount === 0) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      await client.query('COMMIT');
      return this.findVersionDetail(input.definitionId, input.versionNumber);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async publishVersion(
    definitionId: string,
    versionNumber: number,
    expectedLineageVersion: number,
    actorIdentityId: string,
  ): Promise<
    ServiceDefinitionVersionDetail | null | 'VERSION_CONFLICT' | 'NOT_DRAFT' | 'INVALID_STATE' | 'PUBLISH_INVALID'
  > {
    const pool = this.pool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lineage = await client.query<{ version: number; status: LineageStatus; code: string }>(
        `SELECT version, status, code FROM cat.service_definitions WHERE id = $1 FOR UPDATE`,
        [definitionId],
      );
      const lineageRow = lineage.rows[0];
      if (!lineageRow) {
        await client.query('ROLLBACK');
        return null;
      }
      if (lineageRow.status !== 'ACTIVE') {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }
      if (lineageRow.version !== expectedLineageVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      const draft = await client.query<{
        id: string;
        name: string;
        category_id: string;
        archetype: string;
      }>(
        `SELECT id, name, category_id, archetype
         FROM cat.service_definition_versions
         WHERE service_definition_id = $1
           AND version = $2
         FOR UPDATE`,
        [definitionId, versionNumber],
      );
      const draftRow = draft.rows[0];
      if (!draftRow) {
        await client.query('ROLLBACK');
        return null;
      }

      const units = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM cat.service_allowed_units
         WHERE service_definition_version_id = $1`,
        [draftRow.id],
      );
      const unitCount = Number(units.rows[0]?.count ?? '0');
      if (
        !lineageRow.code ||
        !draftRow.name?.trim() ||
        !draftRow.category_id ||
        !draftRow.archetype ||
        unitCount < 1
      ) {
        await client.query('ROLLBACK');
        return 'PUBLISH_INVALID';
      }

      const statusCheck = await client.query<{ status: string }>(
        `SELECT status FROM cat.service_definition_versions WHERE id = $1`,
        [draftRow.id],
      );
      if (statusCheck.rows[0]?.status !== 'DRAFT') {
        await client.query('ROLLBACK');
        return 'NOT_DRAFT';
      }

      await client.query(
        `UPDATE cat.service_definition_versions
         SET status = 'RETIRED',
             retired_at = now(),
             retired_by_identity_id = $2,
             updated_at = now(),
             updated_by_identity_id = $2
         WHERE service_definition_id = $1
           AND status = 'ACTIVE'`,
        [definitionId, actorIdentityId],
      );

      const published = await client.query(
        `UPDATE cat.service_definition_versions
         SET status = 'ACTIVE',
             published_at = now(),
             published_by_identity_id = $3,
             updated_at = now(),
             updated_by_identity_id = $3
         WHERE id = $1
           AND service_definition_id = $2
           AND status = 'DRAFT'`,
        [draftRow.id, definitionId, actorIdentityId],
      );
      if (published.rowCount === 0) {
        await client.query('ROLLBACK');
        return 'NOT_DRAFT';
      }

      const lineageUpdated = await client.query(
        `UPDATE cat.service_definitions
         SET updated_at = now(),
             updated_by_identity_id = $2,
             version = version + 1
         WHERE id = $1
           AND version = $3`,
        [definitionId, actorIdentityId, expectedLineageVersion],
      );
      if (lineageUpdated.rowCount === 0) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      await client.query('COMMIT');
      return this.findVersionDetail(definitionId, versionNumber);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setDefinitionStatus(
    definitionId: string,
    expectedVersion: number,
    status: LineageStatus,
    actorIdentityId: string,
    reason?: string,
  ): Promise<ServiceDefinitionSummary | null | 'VERSION_CONFLICT' | 'INVALID_STATE'> {
    const pool = this.pool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<{ status: LineageStatus }>(
        `SELECT status FROM cat.service_definitions WHERE id = $1 FOR UPDATE`,
        [definitionId],
      );
      const row = current.rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        return null;
      }
      if (row.status === status) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }

      const updated = await client.query(
        `UPDATE cat.service_definitions
         SET status = $3::cat.service_definition_lineage_status,
             version = version + 1,
             updated_at = now(),
             updated_by_identity_id = $4,
             deactivated_at = CASE WHEN $3::text = 'INACTIVE' THEN now() ELSE NULL END,
             deactivated_by_identity_id = CASE WHEN $3::text = 'INACTIVE' THEN $4::uuid ELSE NULL END,
             deactivation_reason = CASE WHEN $3::text = 'INACTIVE' THEN $5 ELSE NULL END
         WHERE id = $1
           AND version = $2`,
        [definitionId, expectedVersion, status, actorIdentityId, reason ?? null],
      );
      if (updated.rowCount === 0) {
        const exists = await client.query(`SELECT 1 FROM cat.service_definitions WHERE id = $1`, [definitionId]);
        await client.query('ROLLBACK');
        if (exists.rowCount === 0) {
          return null;
        }
        return 'VERSION_CONFLICT';
      }
      await client.query('COMMIT');
      return this.findDefinitionSummary(definitionId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async categoryExists(categoryId: string): Promise<boolean> {
    const result = await this.pool().query(
      `SELECT 1 FROM cat.service_categories WHERE id = $1 AND status = 'ACTIVE'`,
      [categoryId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  private async replaceAllowedUnits(
    client: PoolClient,
    versionId: string,
    units: AllowedUnitInput[],
  ): Promise<void> {
    await client.query(`DELETE FROM cat.service_allowed_units WHERE service_definition_version_id = $1`, [
      versionId,
    ]);
    for (const unit of units) {
      await client.query(
        `INSERT INTO cat.service_allowed_units (
           service_definition_version_id, unit_code, is_default, sort_order
         ) VALUES ($1, $2, $3, $4)`,
        [versionId, unit.unitCode, unit.isDefault ?? false, unit.sortOrder ?? 0],
      );
    }
  }
}
