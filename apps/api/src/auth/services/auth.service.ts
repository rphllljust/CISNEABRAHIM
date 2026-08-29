import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { verifyPasswordHash } from '@cisne/database';
import { generateOpaqueToken, hashOpaqueToken } from '../crypto/token-crypto';
import { AUTH_CONFIG } from '../auth.constants';
import type { AuthConfig } from '../config/auth.config';
import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';
import type { LoginInput } from '../dto/login.dto';
import type { RefreshInput } from '../dto/refresh.dto';
import { IdentityAuthRepository } from '../repositories/identity-auth.repository';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { LoginRateLimiterService } from './login-rate-limiter.service';
import { TokenService } from './token.service';
import {
  toAuthTokenResponse,
  toCurrentSessionResponse,
  type AuthTokenResponseV1,
  type CurrentSessionResponseV1,
} from '../serializers/auth-response.serializer';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    private readonly databaseService: DatabaseService,
    private readonly repository: IdentityAuthRepository,
    private readonly tokenService: TokenService,
    private readonly loginRateLimiter: LoginRateLimiterService,
  ) {}

  async login(input: LoginInput, clientKey: string): Promise<AuthTokenResponseV1> {
    try {
      this.loginRateLimiter.assertAllowed(clientKey);
    } catch {
      throw new AuthHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        AUTH_ERROR_CODES.RATE_LIMITED,
        'Too many login attempts. Try again later.',
      );
    }

    const credential = await this.repository.findCredentialByLogin(input.login);
    if (!credential) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid credentials.',
      );
    }

    if (credential.identity_status !== 'active') {
      throw new AuthHttpException(
        HttpStatus.FORBIDDEN,
        AUTH_ERROR_CODES.ACCOUNT_DISABLED,
        'Account is not active.',
      );
    }

    const passwordValid = await verifyPasswordHash(input.password, credential.password_hash);
    if (!passwordValid) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid credentials.',
      );
    }

    return this.issueSessionTokens(credential.identity_id);
  }

  async refresh(input: RefreshInput): Promise<AuthTokenResponseV1> {
    const tokenHash = hashOpaqueToken(input.refreshToken);
    const stored = await this.repository.findRefreshTokenByHash(tokenHash);

    if (!stored) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.UNAUTHORIZED,
        'Invalid refresh token.',
      );
    }

    if (stored.revoked_at && stored.replaced_by_token_id) {
      const pool = this.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await this.repository.revokeFamily(client, stored.family_id);
        await this.repository.revokeSession(client, stored.session_id);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.REFRESH_REUSED,
        'Refresh token reuse detected.',
      );
    }

    if (stored.revoked_at) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.SESSION_REVOKED,
        'Session has been revoked.',
      );
    }

    if (new Date(stored.expires_at).getTime() <= Date.now()) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.SESSION_EXPIRED,
        'Refresh token expired.',
      );
    }

    const session = await this.repository.getSessionById(stored.session_id);
    if (!session || session.status !== 'active') {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.SESSION_REVOKED,
        'Session has been revoked.',
      );
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.SESSION_EXPIRED,
        'Session expired.',
      );
    }

    const pool = this.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const newRefreshPlain = generateOpaqueToken();
      const newRefreshHash = hashOpaqueToken(newRefreshPlain);
      const refreshExpiresAt = new Date(
        Date.now() + this.config.refreshTokenTtlSeconds * 1000,
      ).toISOString();

      const newTokenId = await this.repository.insertRefreshToken(
        client,
        stored.family_id,
        newRefreshHash,
        refreshExpiresAt,
      );

      await this.repository.markRefreshTokenRotated(client, stored.id, newTokenId);
      await client.query('COMMIT');

      const access = this.tokenService.issueAccessToken(stored.identity_id, stored.session_id);

      return toAuthTokenResponse({
        accessToken: access.token,
        refreshToken: newRefreshPlain,
        expiresIn: access.expiresIn,
        sessionId: stored.session_id,
        sessionExpiresAt: session.expires_at,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async logout(sessionId: string): Promise<{ success: true }> {
    const pool = this.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const session = await this.repository.getSessionById(sessionId);
      if (session) {
        await this.repository.revokeSession(client, sessionId);
        const familyResult = await client.query<{ id: string }>(
          `SELECT id FROM identity.refresh_token_families WHERE session_id = $1`,
          [sessionId],
        );
        const familyId = familyResult.rows[0]?.id;
        if (familyId) {
          await this.repository.revokeFamily(client, familyId);
        }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return { success: true };
  }

  async logoutAll(identityId: string): Promise<{ success: true }> {
    await this.repository.revokeAllSessionsForIdentity(identityId);
    return { success: true };
  }

  async currentSession(identityId: string, sessionId: string): Promise<CurrentSessionResponseV1> {
    const session = await this.repository.getSessionById(sessionId);
    if (!session || session.identity_id !== identityId || session.status !== 'active') {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.UNAUTHORIZED,
        'Session is not valid.',
      );
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.SESSION_EXPIRED,
        'Session expired.',
      );
    }

    return toCurrentSessionResponse({
      identityId,
      sessionId: session.id,
      sessionExpiresAt: session.expires_at,
    });
  }

  private async issueSessionTokens(identityId: string): Promise<AuthTokenResponseV1> {
    const pool = this.getPool();
    const client = await pool.connect();

    const sessionExpiresAt = new Date(
      Date.now() + this.config.refreshTokenTtlSeconds * 1000,
    ).toISOString();

    try {
      await client.query('BEGIN');
      const sessionId = await this.repository.createSession(client, identityId, sessionExpiresAt);
      const familyId = await this.repository.createRefreshFamily(client, sessionId, identityId);

      const refreshPlain = generateOpaqueToken();
      const refreshHash = hashOpaqueToken(refreshPlain);
      await this.repository.insertRefreshToken(client, familyId, refreshHash, sessionExpiresAt);
      await client.query('COMMIT');

      const access = this.tokenService.issueAccessToken(identityId, sessionId);

      return toAuthTokenResponse({
        accessToken: access.token,
        refreshToken: refreshPlain,
        expiresIn: access.expiresIn,
        sessionId,
        sessionExpiresAt: sessionExpiresAt,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private getPool() {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }
}
