import { hashPassword, insertIdentity, truncateIdentityAndAuthorizationTables } from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthModule } from './auth.module';
import { AUTH_ERROR_CODES } from './errors/auth-error-codes';
import { normalizeLoginIdentifier } from './crypto/token-crypto';
import { AuthService } from './services/auth.service';
import {
  applyAuthTestEnv,
  assertNoSensitiveLeak,
  AUTH_TEST_PASSWORD,
} from './test/auth-test-env';

describe('Auth adversarial (PostgreSQL integration)', () => {
  let pool: Pool;
  let authService: AuthService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for adversarial auth tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    authService = module.get(AuthService);
    pool = new Pool({ connectionString: testDatabaseUrl });
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
    return `127.0.0.1:adv-${suffix}`;
  }

  it('allows only one winner on concurrent refresh with the same token', async () => {
    const login = await seedActiveUser(`concurrent-refresh-${crypto.randomUUID()}@cisne.invalid`);
    const issued = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('concurrent-refresh') },
    );

    const results = await Promise.allSettled([
      authService.refresh({ refreshToken: issued.refreshToken }),
      authService.refresh({ refreshToken: issued.refreshToken }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    for (const result of fulfilled) {
      if (result.status === 'fulfilled') {
        assertNoSensitiveLeak(result.value);
      }
    }
  });

  it('handles concurrent logout and logout-all idempotently', async () => {
    const login = await seedActiveUser(`concurrent-logout-${crypto.randomUUID()}@cisne.invalid`);
    const first = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('logout-a') },
    );
    const second = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('logout-b') },
    );

    const identityFromSecond = JSON.parse(
      Buffer.from(second.accessToken.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as { sub: string };

    const logoutResults = await Promise.all([
      authService.logout(first.session.id, identityFromSecond.sub),
      authService.logout(first.session.id, identityFromSecond.sub),
    ]);
    expect(logoutResults).toEqual([{ success: true }, { success: true }]);

    const logoutAllResults = await Promise.all([
      authService.logoutAll(identityFromSecond.sub, second.session.id),
      authService.logoutAll(identityFromSecond.sub, second.session.id),
    ]);
    expect(logoutAllResults).toEqual([{ success: true }, { success: true }]);
  });

  it('rejects session and refresh for disabled accounts with existing tokens', async () => {
    const login = await seedActiveUser(`disable-session-${crypto.randomUUID()}@cisne.invalid`);
    const issued = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('disable-session') },
    );

    const identityId = JSON.parse(
      Buffer.from(issued.accessToken.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as { sub: string };

    await pool.query(`UPDATE identity.identities SET status = 'disabled', disabled_at = NOW() WHERE id = $1`, [
      identityId.sub,
    ]);

    await expect(
      authService.currentSession(identityId.sub, issued.session.id),
    ).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.ACCOUNT_DISABLED } },
    });

    await expect(authService.refresh({ refreshToken: issued.refreshToken })).rejects.toMatchObject({
      response: { error: { code: AUTH_ERROR_CODES.ACCOUNT_DISABLED } },
    });
  });

  it('does not expose internal fields in auth responses', async () => {
    const login = await seedActiveUser(`leak-${crypto.randomUUID()}@cisne.invalid`);
    const issued = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      { clientKey: clientKey('leak') },
    );

    assertNoSensitiveLeak(issued);
    expect(Object.keys(issued).sort()).toEqual(
      ['accessToken', 'expiresIn', 'refreshToken', 'session', 'tokenType'].sort(),
    );
    expect(Object.keys(issued.session).sort()).toEqual(['expiresAt', 'id', 'status'].sort());
  });
});
