import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { PhysicalResourceTypeStatus } from '../domain/physical-resource-type';
import type { PhysicalResourceTypeRow } from '../serializers/physical-resource-types-response.serializer';

export type PhysicalResourceTypeReferenceValidation = 'OK' | 'INVALID_TYPE' | 'INACTIVE_TYPE';

@Injectable()
export class PhysicalResourceTypesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findById(resourceTypeId: string): Promise<PhysicalResourceTypeRow | null> {
    const result = await this.pool().query<PhysicalResourceTypeRow>(
      `SELECT id, code, name, classification, status, version,
              created_at, updated_at, deactivated_at
       FROM cat.physical_resource_types
       WHERE id = $1`,
      [resourceTypeId],
    );
    return result.rows[0] ?? null;
  }

  async findByCode(code: string): Promise<PhysicalResourceTypeRow | null> {
    const result = await this.pool().query<PhysicalResourceTypeRow>(
      `SELECT id, code, name, classification, status, version,
              created_at, updated_at, deactivated_at
       FROM cat.physical_resource_types
       WHERE code = $1`,
      [code],
    );
    return result.rows[0] ?? null;
  }

  async list(
    whereClause: string,
    params: unknown[],
    limit: number,
    offset: number,
  ): Promise<PhysicalResourceTypeRow[]> {
    const result = await this.pool().query<PhysicalResourceTypeRow>(
      `SELECT id, code, name, classification, status, version,
              created_at, updated_at, deactivated_at
       FROM cat.physical_resource_types
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
    classification: string;
    actorIdentityId: string;
  }): Promise<PhysicalResourceTypeRow> {
    const result = await this.pool().query<PhysicalResourceTypeRow>(
      `INSERT INTO cat.physical_resource_types (
         code, name, classification, created_by_identity_id, updated_by_identity_id
       ) VALUES ($1, $2, $3::cat.physical_resource_classification, $4, $4)
       RETURNING id, code, name, classification, status, version,
                 created_at, updated_at, deactivated_at`,
      [input.code, input.name, input.classification, input.actorIdentityId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create physical resource type.');
    }
    return row;
  }

  async updateName(
    resourceTypeId: string,
    expectedVersion: number,
    name: string,
    actorIdentityId: string,
  ): Promise<PhysicalResourceTypeRow | null | 'VERSION_CONFLICT'> {
    const result = await this.pool().query<PhysicalResourceTypeRow>(
      `UPDATE cat.physical_resource_types
       SET name = $3,
           version = version + 1,
           updated_at = now(),
           updated_by_identity_id = $4
       WHERE id = $1
         AND version = $2
       RETURNING id, code, name, classification, status, version,
                 created_at, updated_at, deactivated_at`,
      [resourceTypeId, expectedVersion, name, actorIdentityId],
    );
    if ((result.rowCount ?? 0) === 0) {
      const exists = await this.findById(resourceTypeId);
      return exists ? 'VERSION_CONFLICT' : null;
    }
    return result.rows[0] ?? null;
  }

  async setStatus(
    resourceTypeId: string,
    expectedVersion: number,
    status: PhysicalResourceTypeStatus,
    actorIdentityId: string,
  ): Promise<PhysicalResourceTypeRow | null | 'VERSION_CONFLICT' | 'INVALID_STATE'> {
    const current = await this.findById(resourceTypeId);
    if (!current) {
      return null;
    }
    if (current.status === status) {
      return 'INVALID_STATE';
    }

    const result = await this.pool().query<PhysicalResourceTypeRow>(
      `UPDATE cat.physical_resource_types
       SET status = $3::cat.physical_resource_type_status,
           version = version + 1,
           updated_at = now(),
           updated_by_identity_id = $4,
           deactivated_at = CASE WHEN $3::text = 'INACTIVE' THEN now() ELSE NULL END,
           deactivated_by_identity_id = CASE WHEN $3::text = 'INACTIVE' THEN $4::uuid ELSE NULL END
       WHERE id = $1
         AND version = $2
       RETURNING id, code, name, classification, status, version,
                 created_at, updated_at, deactivated_at`,
      [resourceTypeId, expectedVersion, status, actorIdentityId],
    );
    if ((result.rowCount ?? 0) === 0) {
      return 'VERSION_CONFLICT';
    }
    return result.rows[0] ?? null;
  }

  async validateTypeReferences(
    typeCodes: string[],
    requireActive: boolean,
  ): Promise<PhysicalResourceTypeReferenceValidation> {
    const codes = [...new Set(typeCodes)];
    if (codes.length === 0) {
      return 'OK';
    }

    const result = await this.pool().query<{ code: string; status: PhysicalResourceTypeStatus }>(
      `SELECT code, status
       FROM cat.physical_resource_types
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
