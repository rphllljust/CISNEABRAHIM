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

  async listGrants(identityId?: string, includeRevoked = false): Promise<GrantRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (identityId) {
      params.push(identityId);
      conditions.push(`identity_id = $${params.length}`);
    }
    if (!includeRevoked) {
      conditions.push('revoked_at IS NULL');
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
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
       ${where}
       ORDER BY created_at DESC`,
      params,
    );
    return result.rows;
  }

  async listIdentities(input: {
    query?: string;
    status?: 'active' | 'disabled' | 'locked';
    limit?: number;
  }): Promise<
    Array<{
      id: string;
      login: string | null;
      status: string;
      disabled_at: string | null;
      created_at: string;
    }>
  > {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (input.query?.trim()) {
      params.push(`%${input.query.trim()}%`);
      conditions.push(`c.login_identifier_normalized ILIKE $${params.length}`);
    }
    if (input.status) {
      params.push(input.status);
      conditions.push(`i.status = $${params.length}`);
    }
    const limit = Math.min(Math.max(input.limit ?? 100, 1), 200);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.pool().query<{
      id: string;
      login: string | null;
      status: string;
      disabled_at: string | null;
      created_at: string;
    }>(
      `SELECT i.id,
              c.login_identifier_normalized AS login,
              i.status,
              i.disabled_at,
              i.created_at
       FROM identity.identities i
       LEFT JOIN identity.credentials c
         ON c.identity_id = i.id
        AND c.revoked_at IS NULL
       ${where}
       ORDER BY login ASC NULLS LAST
       LIMIT $${params.length + 1}`,
      [...params, limit],
    );
    return result.rows;
  }

  async findRoleDerivedActionRows(identityId: string, action: string): Promise<
    Array<{
      scope_type: AuthzScopeType;
      scope_anchor: string | null;
    }>
  > {
    const result = await this.pool().query<{
      scope_type: AuthzScopeType;
      scope_anchor: string | null;
    }>(
      `SELECT a.scope_type,
              a.scope_anchor
       FROM "authorization".access_role_assignments a
       INNER JOIN "authorization".access_roles r ON r.id = a.role_id
       INNER JOIN "authorization".access_role_capabilities c ON c.role_id = a.role_id
       WHERE a.identity_id = $1
         AND a.revoked_at IS NULL
         AND r.status = 'ACTIVE'
         AND c.capability = $2`,
      [identityId, action],
    );
    return result.rows;
  }
}
