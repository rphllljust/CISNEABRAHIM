import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditModule } from '../audit/audit.module';
import { containsForbiddenSecret } from '../audit/services/audit-redaction.service';
import { SecurityAuditRepository } from '../audit/repositories/security-audit.repository';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../audit/types/security-audit.types';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthService } from '../auth/services/auth.service';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PolicyDecisionPointService } from '../authorization/services/policy-decision-point.service';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';

describe('Security audit PostgreSQL integration', () => {
  let pool: Pool;
  let authService: AuthService;
  let pdp: PolicyDecisionPointService;
  let repository: SecurityAuditRepository;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for security audit integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuditModule, AuthModule, AuthorizationModule],
    }).compile();

    authService = module.get(AuthService);
    pdp = module.get(PolicyDecisionPointService);
    repository = module.get(SecurityAuditRepository);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('records login success without secrets in persisted audit rows', async () => {
    const login = normalizeLoginIdentifier(`audit-login-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    await insertIdentity(pool, login, passwordHash);

    const correlationId = crypto.randomUUID();
    const issued = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: '127.0.0.1:audit', correlationId, clientIp: '127.0.0.1' },
    );

    const rows = await pool.query(
      `SELECT action, outcome, correlation_id, metadata::text AS metadata
       FROM audit.security_audit_events
       WHERE action = $1`,
      [SECURITY_AUDIT_ACTIONS.AuthLogin],
    );

    expect(rows.rowCount).toBe(1);
    const row = rows.rows[0] as {
      action: string;
      outcome: string;
      correlation_id: string;
      metadata: string;
    };
    expect(row.outcome).toBe(SECURITY_AUDIT_OUTCOMES.Success);
    expect(row.correlation_id).toBe(correlationId);
    expect(row.metadata.toLowerCase()).not.toContain(AUTH_TEST_PASSWORD.toLowerCase());
    expect(row.metadata.toLowerCase()).not.toContain(issued.refreshToken.toLowerCase());
    expect(containsForbiddenSecret(JSON.stringify(row))).toBe(false);
  });

  it('records authz denial events with correlation id', async () => {
    const login = normalizeLoginIdentifier(`audit-deny-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    const session = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: '127.0.0.1:audit-deny' },
    );

    const correlationId = crypto.randomUUID();
    const decision = await pdp.decide(
      { identityId, sessionId: session.session.id },
      {
        action: AUTHZ_ACTIONS.ProbeExecute,
        resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      },
      { correlationId, audit: true },
    );

    expect(decision.result).toBe('DENY');

    const rows = await pool.query<{ action: string; correlation_id: string }>(
      `SELECT action, correlation_id
       FROM audit.security_audit_events
       WHERE action = $1`,
      [SECURITY_AUDIT_ACTIONS.AuthzDenied],
    );
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0]?.correlation_id).toBe(correlationId);
  });

  it('blocks update and delete on append-only security audit rows', async () => {
    const id = await repository.insert({
      action: SECURITY_AUDIT_ACTIONS.AppBootstrap,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Application,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    await expect(
      pool.query(`UPDATE audit.security_audit_events SET action = 'tampered' WHERE id = $1`, [id]),
    ).rejects.toThrow(/append-only/i);

    await expect(
      pool.query(`DELETE FROM audit.security_audit_events WHERE id = $1`, [id]),
    ).rejects.toThrow(/append-only/i);
  });

  it('supports concurrent append-only inserts', async () => {
    const inserts = Array.from({ length: 8 }, (_, index) =>
      repository.insert({
        action: SECURITY_AUDIT_ACTIONS.AppBootstrap,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Application,
        resourceId: `worker-${index}`,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      }),
    );

    const ids = await Promise.all(inserts);
    expect(new Set(ids).size).toBe(8);
  });

  it('redacts sensitive metadata before persistence', async () => {
    const id = await repository.insert({
      action: SECURITY_AUDIT_ACTIONS.AuthLoginFailure,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Identity,
      outcome: SECURITY_AUDIT_OUTCOMES.Failure,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: {
        password: 'must-not-persist',
        refreshToken: 'opaque-token',
        client_ip: '10.0.0.1',
      },
    });

    const row = await pool.query<{ metadata: Record<string, unknown> }>(
      `SELECT metadata FROM audit.security_audit_events WHERE id = $1`,
      [id],
    );
    expect(row.rows[0]?.metadata).toEqual({ client_ip: '10.0.0.1' });
  });

  it('records grant revocation without leaking grant payload secrets', async () => {
    const login = normalizeLoginIdentifier(`audit-grant-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: actorId } = await insertIdentity(pool, login, passwordHash);
    const targetId = crypto.randomUUID();
    await pool.query(`INSERT INTO identity.identities (id, status) VALUES ($1, 'active')`, [targetId]);

    const grantId = await insertGrant(pool, {
      identityId: targetId,
      action: AUTHZ_ACTIONS.ProbeExecute,
      resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      scopeType: 'GLOBAL',
      grantedByIdentityId: actorId,
    });

    await pool.query(
      `UPDATE "authorization".grants
       SET revoked_at = NOW(), revoked_by_identity_id = $2
       WHERE id = $1`,
      [grantId, actorId],
    );

    await repository.insert({
      actorIdentityId: actorId,
      action: SECURITY_AUDIT_ACTIONS.AuthzGrantRevoke,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Grant,
      resourceId: grantId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Critical,
      metadata: { password: 'nope', token: 'nope' },
    });

    const serialized = await pool.query<{ payload: string }>(
      `SELECT row_to_json(t)::text AS payload
       FROM audit.security_audit_events t
       WHERE action = $1`,
      [SECURITY_AUDIT_ACTIONS.AuthzGrantRevoke],
    );
    expect(containsForbiddenSecret(serialized.rows[0]?.payload ?? '')).toBe(false);
  });
});
