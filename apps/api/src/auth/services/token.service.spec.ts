import { describe, expect, it } from 'vitest';
import { AUTH_CONFIG } from '../auth.constants';
import type { AuthConfig } from '../config/auth.config';
import { TokenService } from '../services/token.service';

const testConfig: AuthConfig = {
  jwtSecret: 'unit-test-jwt-secret-32-chars-min!!',
  jwtIssuer: 'cisne-api-test',
  jwtAudience: 'cisne-clients-test',
  accessTokenTtlSeconds: 60,
  refreshTokenTtlSeconds: 3600,
  jwtClockSkewSeconds: 30,
  corsOrigins: ['http://localhost:5173'],
  loginRateLimitPerMinute: 5,
};

describe('TokenService', () => {
  const service = new TokenService(testConfig);

  it('issues and verifies a valid access token', () => {
    const issued = service.issueAccessToken('identity-1', 'session-1');
    expect(issued.token.split('.')).toHaveLength(3);
    expect(issued.expiresIn).toBe(60);

    const claims = service.verifyAccessToken(issued.token);
    expect(claims.sub).toBe('identity-1');
    expect(claims.sid).toBe('session-1');
    expect(claims.jti).toBeTruthy();
  });

  it('rejects tampered tokens', () => {
    const issued = service.issueAccessToken('identity-1', 'session-1');
    const tampered = `${issued.token}x`;
    expect(() => service.verifyAccessToken(tampered)).toThrow();
  });

  it('rejects tokens signed with another secret', () => {
    const other = new TokenService({
      ...testConfig,
      jwtSecret: 'another-secret-with-32-characters!!',
    });
    const issued = other.issueAccessToken('identity-1', 'session-1');
    expect(() => service.verifyAccessToken(issued.token)).toThrow();
  });
});

describe('AUTH_CONFIG injection token', () => {
  it('is a stable string token', () => {
    expect(AUTH_CONFIG).toBe('AUTH_CONFIG');
  });
});
