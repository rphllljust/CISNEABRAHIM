import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { DEVELOPMENT_SEED_LOGIN } from './constants';
import { assertDevelopmentOnly } from './environment';
import { generateSecurePassword, hashPassword } from './password-policy';
import type { SafeSeedResult } from './types';
import { ensureCisneServicePortfolioBaseline } from '../catalog/cisne-service-portfolio-baseline';

function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

async function findIdentityByLogin(
  pool: Pool,
  login: string,
): Promise<{ identityId: string } | null> {
  const normalized = normalizeLogin(login);
  const result = await pool.query<{ identity_id: string }>(
    `SELECT identity_id
     FROM identity.credentials
     WHERE login_identifier_normalized = $1
       AND revoked_at IS NULL`,
    [normalized],
  );

  const identityId = result.rows[0]?.identity_id;
  return identityId ? { identityId } : null;
}

export type DevelopmentSeedOptions = {
  login?: string;
  password?: string;
  emitGeneratedPassword?: (login: string) => void;
};

/**
 * DEVELOPMENT_SEED — idempotent local operator for NODE_ENV=development only.
 * Never returns password or hash in the result object.
 */
export async function runDevelopmentSeed(
  pool: Pool,
  options: DevelopmentSeedOptions = {},
): Promise<SafeSeedResult> {
  assertDevelopmentOnly('DEVELOPMENT_SEED');

  const login = options.login ?? DEVELOPMENT_SEED_LOGIN;
  const normalized = normalizeLogin(login);

  const existing = await findIdentityByLogin(pool, normalized);
  if (existing) {
    const portfolio = await ensureCisneServicePortfolioBaseline(pool);
    return {
      outcome: 'already_exists',
      login: normalized,
      identityId: existing.identityId,
      message: `Development seed identity already present; portfolio ${portfolio.outcome}.`,
    };
  }

  const plainPassword =
    options.password ?? process.env['DEV_SEED_PASSWORD'] ?? generateSecurePassword();
  const passwordHash = await hashPassword(plainPassword);

  const passwordWasGenerated =
    options.password === undefined && process.env['DEV_SEED_PASSWORD'] === undefined;

  if (passwordWasGenerated && options.emitGeneratedPassword) {
    options.emitGeneratedPassword(normalized);
  }

  const identityId = randomUUID();
  const credentialId = randomUUID();

  await pool.query('BEGIN');
  try {
    await pool.query(
      `INSERT INTO identity.identities (id, status)
       VALUES ($1, 'active')`,
      [identityId],
    );

    await pool.query(
      `INSERT INTO identity.credentials (id, identity_id, login_identifier_normalized, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [credentialId, identityId, normalized, passwordHash],
    );

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }

  const portfolio = await ensureCisneServicePortfolioBaseline(pool);

  return {
    outcome: 'created',
    login: normalized,
    identityId,
    message: `Development seed identity created; portfolio ${portfolio.outcome}.`,
  };
}
