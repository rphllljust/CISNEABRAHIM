import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { queryIsUnitRegistered } from '../../infrastructure/database/reference-lookups';
import type { AssetLifecycleStatus } from '../domain/physical-asset';
import type { VehicleProfileInput } from '../dto/physical-assets.dto';
import type { PhysicalAssetDetail } from '../serializers/physical-assets-response.serializer';

const ASSET_SELECT = `
  SELECT
    a.id,
    a.asset_code,
    a.physical_resource_type_id,
    rt.code AS resource_type_code,
    rt.classification::text AS resource_type_classification,
    a.name,
    a.lifecycle_status,
    a.allocation_status,
    a.unit_id,
    a.version,
    a.created_at,
    a.updated_at,
    a.deactivated_at,
    vp.plate_display,
    vp.chassis,
    vp.model
  FROM ast.physical_assets a
  INNER JOIN cat.physical_resource_types rt ON rt.id = a.physical_resource_type_id
  LEFT JOIN ast.vehicle_profiles vp ON vp.asset_id = a.id
`;

function mapRow(row: Record<string, unknown>): PhysicalAssetDetail {
  const hasVehicle = row['plate_display'] !== null && row['plate_display'] !== undefined;
  return {
    id: row['id'] as string,
    asset_code: row['asset_code'] as string,
    physical_resource_type_id: row['physical_resource_type_id'] as string,
    resource_type_code: row['resource_type_code'] as string,
    resource_type_classification: row['resource_type_classification'] as string,
    name: row['name'] as string,
    lifecycle_status: row['lifecycle_status'] as PhysicalAssetDetail['lifecycle_status'],
    allocation_status: row['allocation_status'] as PhysicalAssetDetail['allocation_status'],
    unit_id: row['unit_id'] as string,
    version: row['version'] as number,
    created_at: row['created_at'] as string,
    updated_at: row['updated_at'] as string,
    deactivated_at: (row['deactivated_at'] as string | null) ?? null,
    vehicle: hasVehicle
      ? {
          plate_display: row['plate_display'] as string,
          chassis: (row['chassis'] as string | null) ?? null,
          model: (row['model'] as string | null) ?? null,
        }
      : null,
  };
}

@Injectable()
export class PhysicalAssetsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async isUnitRegistered(unitId: string): Promise<boolean> {
    return queryIsUnitRegistered(this.pool(), unitId);
  }

  async findById(assetId: string): Promise<PhysicalAssetDetail | null> {
    const result = await this.pool().query<Record<string, unknown>>(
      `${ASSET_SELECT} WHERE a.id = $1`,
      [assetId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }

  async list(
    whereClause: string,
    params: unknown[],
    limit: number,
    offset: number,
  ): Promise<PhysicalAssetDetail[]> {
    const result = await this.pool().query<Record<string, unknown>>(
      `${ASSET_SELECT}
       WHERE ${whereClause}
       ORDER BY a.asset_code ASC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    return result.rows.map((row) => mapRow(row));
  }

  async create(input: {
    assetCode: string;
    resourceTypeId: string;
    name: string;
    unitId: string;
    actorIdentityId: string;
    vehicle?: VehicleProfileInput;
  }): Promise<PhysicalAssetDetail> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      const insertResult = await client.query<{ id: string }>(
        `INSERT INTO ast.physical_assets (
           asset_code,
           physical_resource_type_id,
           name,
           unit_id,
           created_by_identity_id,
           updated_by_identity_id
         ) VALUES ($1, $2, $3, $4, $5, $5)
         RETURNING id`,
        [
          input.assetCode,
          input.resourceTypeId,
          input.name,
          input.unitId,
          input.actorIdentityId,
        ],
      );
      const assetId = insertResult.rows[0]?.id;
      if (!assetId) {
        throw new Error('Failed to create physical asset.');
      }

      if (input.vehicle) {
        await client.query(
          `INSERT INTO ast.vehicle_profiles (
             asset_id, normalized_plate, plate_display, chassis, model
           ) VALUES ($1, $2, $3, $4, $5)`,
          [
            assetId,
            input.vehicle.normalizedPlate,
            input.vehicle.plateDisplay,
            input.vehicle.chassis ?? null,
            input.vehicle.model ?? null,
          ],
        );
      }

      await client.query('COMMIT');

      const created = await this.findById(assetId);
      if (!created) {
        throw new Error('Failed to load created physical asset.');
      }
      return created;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(input: {
    assetId: string;
    expectedVersion: number;
    name?: string;
    vehicle?: VehicleProfileInput;
    actorIdentityId: string;
    hasVehicleProfile: boolean;
  }): Promise<PhysicalAssetDetail | null | 'VERSION_CONFLICT'> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      const current = await client.query<{ version: number }>(
        `SELECT version FROM ast.physical_assets WHERE id = $1 FOR UPDATE`,
        [input.assetId],
      );
      const currentRow = current.rows[0];
      if (!currentRow) {
        await client.query('ROLLBACK');
        return null;
      }
      if (currentRow.version !== input.expectedVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      if (input.name !== undefined) {
        await client.query(
          `UPDATE ast.physical_assets
           SET name = $2,
               version = version + 1,
               updated_at = now(),
               updated_by_identity_id = $3
           WHERE id = $1`,
          [input.assetId, input.name, input.actorIdentityId],
        );
      }

      if (input.vehicle !== undefined) {
        if (input.hasVehicleProfile) {
          await client.query(
            `UPDATE ast.vehicle_profiles
             SET normalized_plate = $2,
                 plate_display = $3,
                 chassis = $4,
                 model = $5,
                 updated_at = now()
             WHERE asset_id = $1`,
            [
              input.assetId,
              input.vehicle.normalizedPlate,
              input.vehicle.plateDisplay,
              input.vehicle.chassis ?? null,
              input.vehicle.model ?? null,
            ],
          );
        } else {
          await client.query(
            `INSERT INTO ast.vehicle_profiles (
               asset_id, normalized_plate, plate_display, chassis, model
             ) VALUES ($1, $2, $3, $4, $5)`,
            [
              input.assetId,
              input.vehicle.normalizedPlate,
              input.vehicle.plateDisplay,
              input.vehicle.chassis ?? null,
              input.vehicle.model ?? null,
            ],
          );
        }

        if (input.name === undefined) {
          await client.query(
            `UPDATE ast.physical_assets
             SET version = version + 1,
                 updated_at = now(),
                 updated_by_identity_id = $2
             WHERE id = $1`,
            [input.assetId, input.actorIdentityId],
          );
        }
      }

      await client.query('COMMIT');
      return (await this.findById(input.assetId))!;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setLifecycleStatus(
    assetId: string,
    expectedVersion: number,
    status: AssetLifecycleStatus,
    actorIdentityId: string,
  ): Promise<PhysicalAssetDetail | null | 'VERSION_CONFLICT' | 'INVALID_STATE'> {
    const current = await this.findById(assetId);
    if (!current) {
      return null;
    }
    if (current.lifecycle_status === status) {
      return 'INVALID_STATE';
    }

    const result = await this.pool().query(
      `UPDATE ast.physical_assets
       SET lifecycle_status = $3::ast.asset_lifecycle_status,
           version = version + 1,
           updated_at = now(),
           updated_by_identity_id = $4,
           deactivated_at = CASE WHEN $3::text = 'INACTIVE' THEN now() ELSE NULL END,
           deactivated_by_identity_id = CASE WHEN $3::text = 'INACTIVE' THEN $4::uuid ELSE NULL END
       WHERE id = $1
         AND version = $2`,
      [assetId, expectedVersion, status, actorIdentityId],
    );

    if ((result.rowCount ?? 0) === 0) {
      const exists = await this.findById(assetId);
      return exists ? 'VERSION_CONFLICT' : null;
    }

    return (await this.findById(assetId))!;
  }
}
