import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { OperationalLaborTypeStatus } from '../domain/operational-labor-type';
import type { OperationalLaborTypeRow } from '../serializers/operational-labor-types-response.serializer';

export type LaborTypeReferenceValidation = 'OK' | 'INVALID_TYPE' | 'INACTIVE_TYPE';

@Injectable()
export class OperationalLaborTypesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findById(laborTypeId: string): Promise<OperationalLaborTypeRow | null> {
    const result = await this.pool().query<OperationalLaborTypeRow>(
      `SELECT id, code, name, status, version, created_at, updated_at, deactivated_at
       FROM cat.operational_labor_types
       WHERE id = $1`,
      [laborTypeId],
    );
    return result.rows[0] ?? null;
  }

  async list(
    whereClause: string,
    params: unknown[],
    limit: number,
    offset: number,
  ): Promise<OperationalLaborTypeRow[]> {
    const result = await this.pool().query<OperationalLaborTypeRow>(
      `SELECT id, code, name, status, version, created_at, updated_at, deactivated_at
       FROM cat.operational_labor_types
       WHERE ${whereClause}
       ORDER BY code ASC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    return result.rows;
  }

  async create(input: {
    code: string;
    name: string;
    actorIdentityId: string;
  }): Promise<OperationalLaborTypeRow> {
    const result = await this.pool().query<OperationalLaborTypeRow>(
      `INSERT INTO cat.operational_labor_types (
         code, name, created_by_identity_id, updated_by_identity_id
       ) VALUES ($1, $2, $3, $3)
       RETURNING id, code, name, status, version, created_at, updated_at, deactivated_at`,
      [input.code, input.name, input.actorIdentityId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create operational labor type.');
    }
    return row;
  }

  async updateName(
    laborTypeId: string,
    expectedVersion: number,
    name: string,
    actorIdentityId: string,
  ): Promise<OperationalLaborTypeRow | null | 'VERSION_CONFLICT'> {
    const result = await this.pool().query<OperationalLaborTypeRow>(
      `UPDATE cat.operational_labor_types
       SET name = $3,
           version = version + 1,
           updated_at = now(),
           updated_by_identity_id = $4
       WHERE id = $1
         AND version = $2
       RETURNING id, code, name, status, version, created_at, updated_at, deactivated_at`,
      [laborTypeId, expectedVersion, name, actorIdentityId],
    );
    if ((result.rowCount ?? 0) === 0) {
      const exists = await this.findById(laborTypeId);
      return exists ? 'VERSION_CONFLICT' : null;
    }
    return result.rows[0] ?? null;
  }

  async setStatus(
    laborTypeId: string,
    expectedVersion: number,
    status: OperationalLaborTypeStatus,
    actorIdentityId: string,
  ): Promise<OperationalLaborTypeRow | null | 'VERSION_CONFLICT' | 'INVALID_STATE'> {
    const current = await this.findById(laborTypeId);
    if (!current) {
      return null;
    }
    if (current.status === status) {
      return 'INVALID_STATE';
    }

    const result = await this.pool().query<OperationalLaborTypeRow>(
      `UPDATE cat.operational_labor_types
       SET status = $3::cat.operational_labor_type_status,
           version = version + 1,
           updated_at = now(),
           updated_by_identity_id = $4,
           deactivated_at = CASE WHEN $3::text = 'INACTIVE' THEN now() ELSE NULL END,
           deactivated_by_identity_id = CASE WHEN $3::text = 'INACTIVE' THEN $4::uuid ELSE NULL END
       WHERE id = $1
         AND version = $2
       RETURNING id, code, name, status, version, created_at, updated_at, deactivated_at`,
      [laborTypeId, expectedVersion, status, actorIdentityId],
    );
    if ((result.rowCount ?? 0) === 0) {
      return 'VERSION_CONFLICT';
    }
    return result.rows[0] ?? null;
  }

  async validateTypeReferences(
    typeCodes: string[],
    requireActive: boolean,
  ): Promise<LaborTypeReferenceValidation> {
    const codes = [...new Set(typeCodes)];
    if (codes.length === 0) {
      return 'OK';
    }

    const result = await this.pool().query<{ code: string; status: OperationalLaborTypeStatus }>(
      `SELECT code, status
       FROM cat.operational_labor_types
       WHERE code = ANY($1::text[])`,
      [codes],
    );
    if (result.rowCount !== codes.length) {
      return 'INVALID_TYPE';
    }
    if (requireActive && result.rows.some((row) => row.status !== 'ACTIVE')) {
      return 'INACTIVE_TYPE';
    }
    return 'OK';
  }
}
