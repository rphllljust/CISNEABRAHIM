import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { ApprovalMatrixError } from '../domain/approval-matrix';

export type ApprovalMatrixRow = {
  id: string;
  code: string;
  currency_code: string;
  published_version: number | null;
  draft_version: number;
  version: number;
};

export type ApprovalMatrixVersionRow = {
  id: string;
  matrix_id: string;
  version: number;
  status: string;
};

export type ApprovalMatrixRuleRow = {
  id: string;
  version_id: string;
  operation: string;
  role_code: string;
  capability: string;
  scope_type: string;
  scope_anchor: string | null;
  amount_limit: string;
  line_number: number;
};

export type ApprovalRoleAssignmentRow = {
  id: string;
  identity_id: string;
  role_code: string;
  scope_type: string;
  scope_anchor: string | null;
};

const MATRIX_RETURNING = `
  id, code, currency_code, published_version, draft_version, version
`;

@Injectable()
export class ApprovalMatrixRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findById(matrixId: string): Promise<ApprovalMatrixRow | null> {
    const result = await this.pool().query<ApprovalMatrixRow>(
      `SELECT ${MATRIX_RETURNING} FROM "authorization".approval_matrices WHERE id = $1`,
      [matrixId],
    );
    return result.rows[0] ?? null;
  }

  async create(input: {
    code: string;
    currencyCode: string;
    actorIdentityId: string;
  }): Promise<ApprovalMatrixRow> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const matrix = await client.query<ApprovalMatrixRow>(
        `INSERT INTO "authorization".approval_matrices (code, currency_code)
         VALUES ($1, $2)
         RETURNING ${MATRIX_RETURNING}`,
        [input.code, input.currencyCode],
      );
      await client.query(
        `INSERT INTO "authorization".approval_matrix_versions (matrix_id, version, created_by_identity_id)
         VALUES ($1, 1, $2)`,
        [matrix.rows[0]!.id, input.actorIdentityId],
      );
      await client.query('COMMIT');
      return matrix.rows[0]!;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async addRules(input: {
    matrixId: string;
    expectedVersion: number;
    rules: Array<{
      operation: string;
      roleCode: string;
      capability: string;
      scopeType: string;
      scopeAnchor: string | null;
      amountLimit: string;
    }>;
  }): Promise<ApprovalMatrixRow | 'VERSION_CONFLICT' | 'INVALID_STATE' | null> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await this.lockMatrix(client, input.matrixId);
      if (!locked) {
        await client.query('ROLLBACK');
        return null;
      }
      if (locked.version !== input.expectedVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      const draft = await this.findVersion(client, locked.id, locked.draft_version);
      if (!draft || draft.status !== 'DRAFT') {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }
      const existing = await client.query<{ max: string }>(
        `SELECT coalesce(max(line_number), 0)::text AS max
         FROM "authorization".approval_matrix_rules WHERE version_id = $1`,
        [draft.id],
      );
      let line = Number(existing.rows[0]?.max ?? '0');
      for (const rule of input.rules) {
        line += 1;
        await client.query(
          `INSERT INTO "authorization".approval_matrix_rules (
             version_id, operation, role_code, capability, scope_type, scope_anchor, amount_limit, line_number
           ) VALUES ($1, $2::"authorization".approval_operation, $3, $4, $5::"authorization".authz_scope_type, $6, $7, $8)`,
          [
            draft.id,
            rule.operation,
            rule.roleCode,
            rule.capability,
            rule.scopeType,
            rule.scopeAnchor,
            rule.amountLimit,
            line,
          ],
        );
      }
      await client.query('COMMIT');
      return locked;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async publish(input: {
    matrixId: string;
    expectedVersion: number;
    actorIdentityId: string;
  }): Promise<ApprovalMatrixRow | 'VERSION_CONFLICT' | 'INVALID_STATE' | null> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await this.lockMatrix(client, input.matrixId);
      if (!locked) {
        await client.query('ROLLBACK');
        return null;
      }
      if (locked.version !== input.expectedVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      const draft = await this.findVersion(client, locked.id, locked.draft_version);
      if (!draft || draft.status !== 'DRAFT') {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }
      const rules = await client.query(
        `SELECT 1 FROM "authorization".approval_matrix_rules WHERE version_id = $1 LIMIT 1`,
        [draft.id],
      );
      if (rules.rowCount === 0) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }
      if (locked.published_version) {
        await client.query(
          `UPDATE "authorization".approval_matrix_versions
           SET status = 'SUPERSEDED'
           WHERE matrix_id = $1 AND version = $2 AND status = 'PUBLISHED'`,
          [locked.id, locked.published_version],
        );
      }
      await client.query(
        `UPDATE "authorization".approval_matrix_versions
         SET status = 'PUBLISHED', published_by_identity_id = $2, published_at = NOW()
         WHERE id = $1 AND status = 'DRAFT'`,
        [draft.id, input.actorIdentityId],
      );
      const updated = await client.query<ApprovalMatrixRow>(
        `UPDATE "authorization".approval_matrices
         SET published_version = $2, version = version + 1, updated_at = NOW()
         WHERE id = $1 AND version = $3
         RETURNING ${MATRIX_RETURNING}`,
        [locked.id, draft.version, locked.version],
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      await client.query('COMMIT');
      return updated.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async amend(input: {
    matrixId: string;
    expectedVersion: number;
    actorIdentityId: string;
  }): Promise<ApprovalMatrixRow | 'VERSION_CONFLICT' | 'INVALID_STATE' | null> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await this.lockMatrix(client, input.matrixId);
      if (!locked) {
        await client.query('ROLLBACK');
        return null;
      }
      if (locked.version !== input.expectedVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      if (!locked.published_version) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }
      const nextVersion = locked.draft_version + 1;
      await client.query(
        `INSERT INTO "authorization".approval_matrix_versions (matrix_id, version, created_by_identity_id)
         VALUES ($1, $2, $3)`,
        [locked.id, nextVersion, input.actorIdentityId],
      );
      const updated = await client.query<ApprovalMatrixRow>(
        `UPDATE "authorization".approval_matrices
         SET draft_version = $2, version = version + 1, updated_at = NOW()
         WHERE id = $1 AND version = $3
         RETURNING ${MATRIX_RETURNING}`,
        [locked.id, nextVersion, locked.version],
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      await client.query('COMMIT');
      return updated.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async assignRole(input: {
    identityId: string;
    roleCode: string;
    scopeType: string;
    scopeAnchor: string | null;
  }): Promise<ApprovalRoleAssignmentRow> {
    try {
      const result = await this.pool().query<ApprovalRoleAssignmentRow>(
        `INSERT INTO "authorization".approval_role_assignments (
           identity_id, role_code, scope_type, scope_anchor
         ) VALUES ($1, $2, $3::"authorization".authz_scope_type, $4)
         RETURNING id, identity_id, role_code, scope_type::text AS scope_type, scope_anchor`,
        [input.identityId, input.roleCode, input.scopeType, input.scopeAnchor],
      );
      const assigned = result.rows[0];
      if (!assigned) {
        throw new Error('APPROVAL_ROLE_ASSIGN_FAILED');
      }
      return assigned;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== '23505') {
        throw error;
      }
      const existing = await this.pool().query<ApprovalRoleAssignmentRow>(
        `SELECT id, identity_id, role_code, scope_type::text AS scope_type, scope_anchor
         FROM "authorization".approval_role_assignments
         WHERE identity_id = $1
           AND role_code = $2
           AND scope_type = $3::"authorization".authz_scope_type
           AND COALESCE(scope_anchor, '') = COALESCE($4, '')`,
        [input.identityId, input.roleCode, input.scopeType, input.scopeAnchor],
      );
      if (!existing.rows[0]) {
        throw error;
      }
      return existing.rows[0];
    }
  }

  async listPublishedRules(): Promise<ApprovalMatrixRuleRow[]> {
    const result = await this.pool().query<ApprovalMatrixRuleRow>(
      `SELECT r.id, r.version_id, r.operation::text AS operation, r.role_code, r.capability,
              r.scope_type::text AS scope_type, r.scope_anchor, r.amount_limit::text AS amount_limit,
              r.line_number
       FROM "authorization".approval_matrix_rules r
       INNER JOIN "authorization".approval_matrix_versions v ON v.id = r.version_id
       WHERE v.status = 'PUBLISHED'
       ORDER BY r.line_number`,
    );
    return result.rows;
  }

  async listAssignments(identityId: string): Promise<ApprovalRoleAssignmentRow[]> {
    const result = await this.pool().query<ApprovalRoleAssignmentRow>(
      `SELECT id, identity_id, role_code, scope_type::text AS scope_type, scope_anchor
       FROM "authorization".approval_role_assignments
       WHERE identity_id = $1`,
      [identityId],
    );
    return result.rows;
  }

  async countPublishedVersions(matrixId: string): Promise<number> {
    const result = await this.pool().query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM "authorization".approval_matrix_versions
       WHERE matrix_id = $1 AND status = 'PUBLISHED'`,
      [matrixId],
    );
    return Number(result.rows[0]?.count ?? '0');
  }

  async listMatricesOverview(): Promise<
    Array<{
      id: string;
      code: string;
      currency_code: string;
      published_version: number | null;
      draft_version: number;
      published_versions: number;
      draft_versions: number;
    }>
  > {
    const result = await this.pool().query<{
      id: string;
      code: string;
      currency_code: string;
      published_version: number | null;
      draft_version: number;
      published_versions: number;
      draft_versions: number;
    }>(
      `SELECT m.id,
              m.code,
              m.currency_code,
              m.published_version,
              m.draft_version,
              (SELECT count(*) FROM "authorization".approval_matrix_versions v
                WHERE v.matrix_id = m.id AND v.status = 'PUBLISHED')::int AS published_versions,
              (SELECT count(*) FROM "authorization".approval_matrix_versions v
                WHERE v.matrix_id = m.id AND v.status = 'DRAFT')::int AS draft_versions
       FROM "authorization".approval_matrices m
       ORDER BY m.code`,
    );
    return result.rows;
  }

  async listMatrixVersionRules(
    matrixId: string,
    status: 'PUBLISHED' | 'DRAFT',
  ): Promise<ApprovalMatrixRuleRow[]> {
    const result = await this.pool().query<ApprovalMatrixRuleRow>(
      `SELECT r.id, r.version_id, r.operation::text AS operation, r.role_code, r.capability,
              r.scope_type::text AS scope_type, r.scope_anchor, r.amount_limit::text AS amount_limit,
              r.line_number
       FROM "authorization".approval_matrix_rules r
       INNER JOIN "authorization".approval_matrix_versions v ON v.id = r.version_id
       WHERE v.matrix_id = $1
         AND v.status = $2
       ORDER BY v.version DESC, r.line_number`,
      [matrixId, status],
    );
    return result.rows;
  }

  async listApprovalRoleAssignments(
    identityId?: string,
  ): Promise<
    Array<{
      id: string;
      identity_id: string;
      identity_login: string | null;
      role_code: string;
      scope_type: string;
      scope_anchor: string | null;
      version: number;
      created_at: string;
    }>
  > {
    const where = identityId ? 'WHERE a.identity_id = $1' : '';
    const params = identityId ? [identityId] : [];
    const result = await this.pool().query<{
      id: string;
      identity_id: string;
      identity_login: string | null;
      role_code: string;
      scope_type: string;
      scope_anchor: string | null;
      version: number;
      created_at: string;
    }>(
      `SELECT a.id,
              a.identity_id,
              c.login_identifier_normalized AS identity_login,
              a.role_code,
              a.scope_type::text AS scope_type,
              a.scope_anchor,
              a.version,
              a.created_at
       FROM "authorization".approval_role_assignments a
       LEFT JOIN identity.credentials c
         ON c.identity_id = a.identity_id
        AND c.revoked_at IS NULL
       ${where}
       ORDER BY a.created_at DESC`,
      params,
    );
    return result.rows;
  }

  private async lockMatrix(client: PoolClient, matrixId: string): Promise<ApprovalMatrixRow | null> {
    const result = await client.query<ApprovalMatrixRow>(
      `SELECT ${MATRIX_RETURNING} FROM "authorization".approval_matrices WHERE id = $1 FOR UPDATE`,
      [matrixId],
    );
    return result.rows[0] ?? null;
  }

  private async findVersion(
    client: PoolClient,
    matrixId: string,
    version: number,
  ): Promise<ApprovalMatrixVersionRow | null> {
    const result = await client.query<ApprovalMatrixVersionRow>(
      `SELECT id, matrix_id, version, status::text AS status
       FROM "authorization".approval_matrix_versions
       WHERE matrix_id = $1 AND version = $2
       FOR UPDATE`,
      [matrixId, version],
    );
    return result.rows[0] ?? null;
  }
}

export function mapRepositoryOutcome(
  outcome: ApprovalMatrixRow | 'VERSION_CONFLICT' | 'INVALID_STATE' | null,
): ApprovalMatrixRow {
  if (outcome === null) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_NOT_FOUND');
  }
  if (outcome === 'VERSION_CONFLICT') {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_VERSION_CONFLICT');
  }
  if (outcome === 'INVALID_STATE') {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_INVALID_STATE');
  }
  return outcome;
}
