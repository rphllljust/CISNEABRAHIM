import { hashPassword, insertIdentity, truncateIdentityAndAuthorizationTables } from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthModule } from './auth.module';
import { AUTH_ERROR_CODES } from './errors/auth-error-codes';
import { AuthHttpException } from './errors/auth-http.exception';
import { normalizeLoginIdentifier, hashOpaqueToken } from './crypto/token-crypto';
import { AuthService } from './services/auth.service';
import {
  applyAuthTestEnv,
  assertNoSensitiveLeak,
  AUTH_TEST_PASSWORD,
} from './test/auth-test-env';

describe('Auth PostgreSQL integration', () => {
  let pool: Pool;
  let authService: AuthService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for auth integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    authService = module.get(AuthService);
    pool = new Pool({ connectionString: testDatabaseUrl });
    await pool.query('SELECT 1');
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActiveUser(rawLogin: string): Promise<string> {
    const login = normalizeLoginIdentifier(rawLogin);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    await insertIdentity(pool, login, passwordHash);
    return login;
  }

  function clientKey(suffix: string): string {
    return `127.0.0.1:vitest-${suffix}`;
  }

  function identityIdFromAccessToken(accessToken: string): string {
    const encodedPayload = accessToken.split('.')[1];
    if (!encodedPayload) {
      throw new Error('invalid access token');
    }
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
      sub: string;
    };
    return payload.sub;
  }

  it('logs in with valid credentials and never leaks secrets', async () => {
    const login = await seedActiveUser(`active-${crypto.randomUUID()}@cisne.invalid`);

    const result = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('valid-login') },
    );

    assertNoSensitiveLeak(result);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.session.id).toBeTruthy();
  });

  it('rejects invalid credentials without enumeration', async () => {
    const login = await seedActiveUser(`missing-${crypto.randomUUID()}@cisne.invalid`);
    const key = clientKey('invalid-creds');

    await expect(
      authService.login({ login: `ghost-${crypto.randomUUID()}@cisne.invalid`, password: AUTH_TEST_PASSWORD }, { clientKey: key }),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS } },
    });

    await expect(
      authService.login({ login, password: 'WrongPassword1!' }, { clientKey: key }),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS } },
    });
  });

  it('rejects disabled accounts', async () => {
    const login = normalizeLoginIdentifier(`disabled-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const identityId = crypto.randomUUID();
    const credentialId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO identity.identities (id, status, disabled_at)
       VALUES ($1, 'disabled', NOW())`,
      [identityId],
    );
    await pool.query(
      `INSERT INTO identity.credentials (id, identity_id, login_identifier_normalized, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [credentialId, identityId, login, passwordHash],
    );

    await expect(
      authService.login({ login, password: AUTH_TEST_PASSWORD }, { clientKey: clientKey('disabled') }),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS } },
    });
  });

  it('rotates refresh tokens and detects reuse', async () => {
    const login = await seedActiveUser(`refresh-${crypto.randomUUID()}@cisne.invalid`);

    const first = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('refresh') },
    );
    const rotated = await authService.refresh({ refreshToken: first.refreshToken });
    expect(rotated.refreshToken).not.toBe(first.refreshToken);

    await expect(
      authService.refresh({ refreshToken: first.refreshToken }),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.REFRESH_REUSED } },
    });

    await expect(
      authService.refresh({ refreshToken: rotated.refreshToken }),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.SESSION_REVOKED } },
    });
  });

  it('rejects expired and revoked refresh tokens', async () => {
    const login = await seedActiveUser(`expired-${crypto.randomUUID()}@cisne.invalid`);
    const issued = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('expired') },
    );

    await pool.query(
      `UPDATE identity.refresh_tokens
       SET created_at = NOW() - INTERVAL '2 hours',
           expires_at = NOW() - INTERVAL '1 hour'
       WHERE token_hash = $1`,
      [hashOpaqueToken(issued.refreshToken)],
    );

    await expect(
      authService.refresh({ refreshToken: issued.refreshToken }),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.SESSION_EXPIRED } },
    });

    const login2 = await seedActiveUser(`revoked-${crypto.randomUUID()}@cisne.invalid`);
    const session = await authService.login(
      { login: login2, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('revoked') },
    );
    await authService.logout(
      session.session.id,
      identityIdFromAccessToken(session.accessToken),
    );

    await expect(
      authService.refresh({ refreshToken: session.refreshToken }),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.SESSION_REVOKED } },
    });
  });

  it('supports logout and logout-all', async () => {
    const login = await seedActiveUser(`logout-${crypto.randomUUID()}@cisne.invalid`);

    const first = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('logout-1') },
    );
    const second = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('logout-2') },
    );

    await authService.logout(
      first.session.id,
      identityIdFromAccessToken(first.accessToken),
    );
    await expect(
      authService.currentSession(
        identityIdFromAccessToken(first.accessToken),
        first.session.id,
      ),
    ).rejects.toBeInstanceOf(AuthHttpException);

    const identityId = identityIdFromAccessToken(second.accessToken);
    const current = await authService.currentSession(identityId, second.session.id);
    expect(current.identityId).toBeTruthy();

    await authService.logoutAll(current.identityId, second.session.id);
    await expect(
      authService.refresh({ refreshToken: second.refreshToken }),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.SESSION_REVOKED } },
    });
  });

  it('enforces login rate limiting', async () => {
    const login = await seedActiveUser(`rate-${crypto.randomUUID()}@cisne.invalid`);
    const abuseKey = '10.0.0.1:abuse';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        authService.login({ login, password: 'WrongPassword1!' }, { clientKey: abuseKey }),
      ).rejects.toMatchObject({
        response: { error: { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS } },
      });
    }

    await expect(
      authService.login({ login, password: 'WrongPassword1!' }, { clientKey: abuseKey }),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.RATE_LIMITED } },
    });
  });
});
