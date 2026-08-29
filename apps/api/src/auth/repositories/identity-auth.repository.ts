import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';

export type CredentialRow = {
  identity_id: string;
  password_hash: string;
  identity_status: 'active' | 'disabled' | 'locked';
};

export type SessionRow = {
  id: string;
  identity_id: string;
  status: 'active' | 'revoked' | 'expired';
  expires_at: string;
  revoked_at: string | null;
};

export type RefreshTokenRow = {
  id: string;
  family_id: string;
  identity_id: string;
  session_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  replaced_by_token_id: string | null;
};

export type RefreshTokenLockedRow = RefreshTokenRow & {
  family_revoked_at: string | null;
  identity_status: 'active' | 'disabled' | 'locked';
};

@Injectable()
export class IdentityAuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findCredentialByLogin(login: string): Promise<CredentialRow | null> {
    const result = await this.pool().query<CredentialRow>(
      `SELECT c.identity_id,
              c.password_hash,
              i.status AS identity_status
       FROM identity.credentials c
       INNER JOIN identity.identities i ON i.id = c.identity_id
       WHERE c.login_identifier_normalized = $1
         AND c.revoked_at IS NULL`,
      [login],
    );

    return result.rows[0] ?? null;
  }

  async createSession(
    client: Pool | PoolClient,
    identityId: string,
    expiresAt: string,
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO identity.sessions (identity_id, expires_at)
       VALUES ($1, $2::timestamptz)
       RETURNING id`,
      [identityId, expiresAt],
    );
    const sessionId = result.rows[0]?.id;
    if (!sessionId) {
      throw new Error('failed to create session');
    }
    return sessionId;
  }

  async createRefreshFamily(
    client: Pool | PoolClient,
    sessionId: string,
    identityId: string,
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO identity.refresh_token_families (session_id, identity_id)
       VALUES ($1, $2)
       RETURNING id`,
      [sessionId, identityId],
    );
    const familyId = result.rows[0]?.id;
    if (!familyId) {
      throw new Error('failed to create refresh family');
    }
    return familyId;
  }

  async insertRefreshToken(
    client: Pool | PoolClient,
    familyId: string,
    tokenHash: string,
    expiresAt: string,
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO identity.refresh_tokens (family_id, token_hash, expires_at)
       VALUES ($1, $2, $3::timestamptz)
       RETURNING id`,
      [familyId, tokenHash, expiresAt],
    );
    const tokenId = result.rows[0]?.id;
    if (!tokenId) {
      throw new Error('failed to insert refresh token');
    }
    return tokenId;
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRow | null> {
    const result = await this.pool().query<RefreshTokenRow>(
      `SELECT rt.id,
              rt.family_id,
              rtf.identity_id,
              rtf.session_id,
              rt.token_hash,
              rt.expires_at,
              rt.revoked_at,
              rt.replaced_by_token_id
       FROM identity.refresh_tokens rt
       INNER JOIN identity.refresh_token_families rtf ON rtf.id = rt.family_id
       WHERE rt.token_hash = $1`,
      [tokenHash],
    );
    return result.rows[0] ?? null;
  }

  async getIdentityStatus(identityId: string): Promise<'active' | 'disabled' | 'locked' | null> {
    const result = await this.pool().query<{ status: 'active' | 'disabled' | 'locked' }>(
      `SELECT status FROM identity.identities WHERE id = $1`,
      [identityId],
    );
    return result.rows[0]?.status ?? null;
  }

  async findRefreshTokenByHashForUpdate(
    client: PoolClient,
    tokenHash: string,
  ): Promise<RefreshTokenLockedRow | null> {
    const result = await client.query<RefreshTokenLockedRow>(
      `SELECT rt.id,
              rt.family_id,
              rtf.identity_id,
              rtf.session_id,
              rt.token_hash,
              rt.expires_at,
              rt.revoked_at,
              rt.replaced_by_token_id,
              rtf.revoked_at AS family_revoked_at,
              i.status AS identity_status
       FROM identity.refresh_tokens rt
       INNER JOIN identity.refresh_token_families rtf ON rtf.id = rt.family_id
       INNER JOIN identity.identities i ON i.id = rtf.identity_id
       WHERE rt.token_hash = $1
       FOR UPDATE OF rt`,
      [tokenHash],
    );
    return result.rows[0] ?? null;
  }

  async getSessionByIdForUpdate(client: PoolClient, sessionId: string): Promise<SessionRow | null> {
    const result = await client.query<SessionRow>(
      `SELECT id, identity_id, status, expires_at, revoked_at
       FROM identity.sessions
       WHERE id = $1
       FOR UPDATE`,
      [sessionId],
    );
    return result.rows[0] ?? null;
  }

  async getSessionById(sessionId: string): Promise<SessionRow | null> {
    const result = await this.pool().query<SessionRow>(
      `SELECT id, identity_id, status, expires_at, revoked_at
       FROM identity.sessions
       WHERE id = $1`,
      [sessionId],
    );
    return result.rows[0] ?? null;
  }

  async revokeSession(client: Pool | PoolClient, sessionId: string): Promise<void> {
    await client.query(
      `UPDATE identity.sessions
       SET status = 'revoked', revoked_at = NOW(), version = version + 1
       WHERE id = $1 AND status = 'active'`,
      [sessionId],
    );
  }

  async revokeFamily(client: Pool | PoolClient, familyId: string): Promise<void> {
    await client.query(
      `UPDATE identity.refresh_token_families
       SET revoked_at = NOW()
       WHERE id = $1 AND revoked_at IS NULL`,
      [familyId],
    );

    await client.query(
      `UPDATE identity.refresh_tokens
       SET revoked_at = NOW()
       WHERE family_id = $1 AND revoked_at IS NULL`,
      [familyId],
    );
  }

  async markRefreshTokenRotated(
    client: Pool | PoolClient,
    tokenId: string,
    replacedByTokenId: string,
  ): Promise<boolean> {
    const result = await client.query<{ id: string }>(
      `UPDATE identity.refresh_tokens
       SET revoked_at = NOW(), replaced_by_token_id = $2
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING id`,
      [tokenId, replacedByTokenId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async revokeAllSessionsForIdentity(identityId: string): Promise<void> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE identity.sessions
         SET status = 'revoked', revoked_at = NOW(), version = version + 1
         WHERE identity_id = $1 AND status = 'active'`,
        [identityId],
      );
      await client.query(
        `UPDATE identity.refresh_token_families
         SET revoked_at = NOW()
         WHERE identity_id = $1 AND revoked_at IS NULL`,
        [identityId],
      );
      await client.query(
        `UPDATE identity.refresh_tokens rt
         SET revoked_at = NOW()
         FROM identity.refresh_token_families rtf
         WHERE rt.family_id = rtf.id
           AND rtf.identity_id = $1
           AND rt.revoked_at IS NULL`,
        [identityId],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
