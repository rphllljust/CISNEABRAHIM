import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { AuthConfig } from '../config/auth.config';
import { TokenService } from './token.service';

const testSecret = 'unit-test-jwt-secret-32-chars-min!!';

const testConfig: AuthConfig = {
  jwtSecret: testSecret,
  jwtIssuer: 'cisne-api-test',
  jwtAudience: 'cisne-clients-test',
  accessTokenTtlSeconds: 60,
  refreshTokenTtlSeconds: 3600,
  jwtClockSkewSeconds: 30,
  corsOrigins: ['http://localhost:5173'],
  loginRateLimitPerMinute: 5,
};

function buildJwt(
  payload: Record<string, unknown>,
  secret: string = testSecret,
  header: Record<string, unknown> = { alg: 'HS256', typ: 'JWT' },
): string {
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

describe('TokenService adversarial', () => {
  const service = new TokenService(testConfig);

  it('rejects tampered signatures', () => {
    const issued = service.issueAccessToken('identity-1', 'session-1');
    expect(() => service.verifyAccessToken(`${issued.token}x`)).toThrow();
  });

  it('rejects wrong issuer and audience', () => {
    const now = Math.floor(Date.now() / 1000);
    const wrongIssuer = buildJwt({
      sub: 'id',
      sid: 'sid',
      jti: 'jti',
      iss: 'evil-issuer',
      aud: 'cisne-clients-test',
      iat: now,
      exp: now + 60,
    });
    const wrongAudience = buildJwt({
      sub: 'id',
      sid: 'sid',
      jti: 'jti',
      iss: 'cisne-api-test',
      aud: 'evil-audience',
      iat: now,
      exp: now + 60,
    });

    expect(() => service.verifyAccessToken(wrongIssuer)).toThrow();
    expect(() => service.verifyAccessToken(wrongAudience)).toThrow();
  });

  it('rejects expired and future tokens', () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = buildJwt({
      sub: 'id',
      sid: 'sid',
      jti: 'jti',
      iss: 'cisne-api-test',
      aud: 'cisne-clients-test',
      iat: now - 120,
      exp: now - 60,
    });
    const future = buildJwt({
      sub: 'id',
      sid: 'sid',
      jti: 'jti',
      iss: 'cisne-api-test',
      aud: 'cisne-clients-test',
      iat: now + 600,
      exp: now + 660,
    });

    expect(() => service.verifyAccessToken(expired)).toThrow('token expired');
    expect(() => service.verifyAccessToken(future)).toThrow('token not yet valid');
  });

  it('rejects missing claims and algorithm confusion', () => {
    const now = Math.floor(Date.now() / 1000);
    const missingSub = buildJwt({
      sid: 'sid',
      jti: 'jti',
      iss: 'cisne-api-test',
      aud: 'cisne-clients-test',
      iat: now,
      exp: now + 60,
    });
    const algNone = buildJwt(
      {
        sub: 'id',
        sid: 'sid',
        jti: 'jti',
        iss: 'cisne-api-test',
        aud: 'cisne-clients-test',
        iat: now,
        exp: now + 60,
      },
      testSecret,
      { alg: 'none', typ: 'JWT' },
    );

    expect(() => service.verifyAccessToken(missingSub)).toThrow();
    expect(() => service.verifyAccessToken(algNone)).toThrow('invalid algorithm');
  });

  it('rejects oversized tokens', () => {
    const huge = `${'a'.repeat(9_000)}.bbb.ccc`;
    expect(() => service.verifyAccessToken(huge)).toThrow('token too large');
  });
});
