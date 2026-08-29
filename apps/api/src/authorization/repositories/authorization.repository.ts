import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { AuthzAction } from '../types/authz-actions';
import type { AuthzResourceType } from '../types/authz-resources';
import type { AuthzScopeType } from '../types/authz-scopes';

export type GrantRow = {
  id: string;
  identity_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  scope_type: AuthzScopeType;
  constraints: Record<string, unknown> | null;
  granted_by_identity_id: string;
  version: number;
  valid_from: string;
  valid_until: string | null;
  revoked_at: string | null;
  revoked_by_identity_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateGrantInput = {
  identityId: string;
  action: AuthzAction;
  resourceType: AuthzResourceType;
  resourceId?: string;
  scopeType: AuthzScopeType;
  constraints?: Record<string, unknown>;
  grantedByIdentityId: string;
  validFrom?: string;
  validUntil?: string;
};

@Injectable()
export class AuthorizationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findActiveGrants(
    identityId: string,
    action: AuthzAction,
    resourceType: AuthzResourceType,
  ): Promise<GrantRow[]> {
    const result = await this.pool().query<GrantRow>(
      `SELECT id,
              identity_id,
              action,
              resource_type,
              resource_id,
              scope_type,
              constraints,
              granted_by_identity_id,
              version,
              valid_from,
              valid_until,
              revoked_at,
              revoked_by_identity_id,
              created_at,
              updated_at
       FROM "authorization".grants
       WHERE identity_id = $1
         AND action = $2
         AND resource_type = $3
         AND revoked_at IS NULL
         AND valid_from <= NOW()
         AND (valid_until IS NULL OR valid_until > NOW())`,
      [identityId, action, resourceType],
    );
    return result.rows;
  }

  async insertGrant(client: Pool | PoolClient, input: CreateGrantInput): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO "authorization".grants (
         identity_id,
         action,
         resource_type,
         resource_id,
         scope_type,
         constraints,
         granted_by_identity_id,
         valid_from,
         valid_until
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, COALESCE($8::timestamptz, NOW()), $9::timestamptz)
       RETURNING id`,
      [
        input.identityId,
        input.action,
        input.resourceType,
        input.resourceId ?? null,
        input.scopeType,
        input.constraints ? JSON.stringify(input.constraints) : null,
        input.grantedByIdentityId,
        input.validFrom ?? null,
        input.validUntil ?? null,
      ],
    );
    const grantId = result.rows[0]?.id;
    if (!grantId) {
      throw new Error('failed to create grant');
    }
    return grantId;
  }

  async revokeGrant(
    client: PoolClient,
    grantId: string,
    revokedByIdentityId: string,
  ): Promise<boolean> {
    const result = await client.query<{ id: string }>(
      `UPDATE "authorization".grants
       SET revoked_at = NOW(),
           revoked_by_identity_id = $2,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $1
         AND revoked_at IS NULL
       RETURNING id`,
      [grantId, revokedByIdentityId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getGrantById(grantId: string): Promise<GrantRow | null> {
    const result = await this.pool().query<GrantRow>(
      `SELECT id,
              identity_id,
              action,
              resource_type,
              resource_id,
              scope_type,
              constraints,
              granted_by_identity_id,
              version,
              valid_from,
              valid_until,
              revoked_at,
              revoked_by_identity_id,
              created_at,
              updated_at
       FROM "authorization".grants
       WHERE id = $1`,
      [grantId],
    );
    return result.rows[0] ?? null;
  }

  async revokeGrantForUpdate(
    client: PoolClient,
    grantId: string,
    revokedByIdentityId: string,
  ): Promise<boolean> {
    const lock = await client.query<{ id: string }>(
      `SELECT id
       FROM "authorization".grants
       WHERE id = $1
       FOR UPDATE`,
      [grantId],
    );
    if (!lock.rows[0]) {
      return false;
    }
    return this.revokeGrant(client, grantId, revokedByIdentityId);
  }

  async insertDecisionAudit(input: {
    identityId: string | null;
    action: string;
    resourceType: string;
    resourceId?: string;
    decision: 'ALLOW' | 'DENY';
    reasonCode: string;
    correlationId?: string;
  }): Promise<void> {
    await this.pool().query(
      `INSERT INTO "authorization".decision_audits (
         identity_id,
         action,
         resource_type,
         resource_id,
         decision,
         reason_code,
         correlation_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.identityId,
        input.action,
        input.resourceType,
        input.resourceId ?? null,
        input.decision,
        input.reasonCode,
        input.correlationId ?? null,
      ],
    );
  }
}
