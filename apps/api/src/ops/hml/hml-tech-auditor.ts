import { insertGrant, insertIdentity, hashPassword } from '@cisne/database';
import type { Pool } from 'pg';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import { resolveResourceType } from '../../uat/uat-vertical-runner';
import { assertHmlIsolation } from './hml-config';
import { findIdentityIdByLogin } from './hml-pilot-operator';

/**
 * Usuário TÉCNICO de auditoria para HML (perfil de menor privilégio):
 * NÃO é o operador piloto e NÃO recebe authz:access-admin:read. Recebe apenas
 * a leitura técnica do registry (platform:module-registry:read) — o mínimo
 * para validar o drawer técnico/detail da Central de Governança sem abrir o
 * console de Access Administration.
 */
export const HML_TECH_AUDITOR_ACTIONS: readonly string[] = [
  AUTHZ_ACTIONS.PlatformModuleRegistryRead,
] as const;

export function listHmlTechAuditorActions(): readonly string[] {
  return [...HML_TECH_AUDITOR_ACTIONS];
}

export type HmlTechAuditorResult = {
  login: string;
  identityId: string;
  created: boolean;
  granted: number;
  alreadyPresent: number;
  actions: string[];
};

export async function ensureHmlTechnicalAuditor(
  pool: Pool,
  input: { login: string; password: string; env?: NodeJS.ProcessEnv },
): Promise<HmlTechAuditorResult> {
  const env = input.env ?? process.env;
  assertHmlIsolation(env);

  const login = input.login.trim().toLowerCase();
  if (login.length < 8 || !login.includes('@')) {
    throw new Error('HML technical auditor login must be a valid email-like identifier');
  }
  if (input.password.length < 16) {
    throw new Error('HML technical auditor password must be at least 16 characters');
  }

  let identityId = await findIdentityIdByLogin(pool, login);
  let created = false;
  if (!identityId) {
    const passwordHash = await hashPassword(input.password);
    const inserted = await insertIdentity(pool, login, passwordHash);
    identityId = inserted.identityId;
    created = true;
  }

  const existing = await pool.query<{ action: string }>(
    `SELECT action
     FROM "authorization".grants
     WHERE identity_id = $1
       AND revoked_at IS NULL`,
    [identityId],
  );
  const present = new Set(existing.rows.map((row) => row.action));
  const actions = listHmlTechAuditorActions();
  let granted = 0;
  let alreadyPresent = 0;

  for (const action of actions) {
    if (present.has(action)) {
      alreadyPresent += 1;
      continue;
    }
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: resolveResourceType(action),
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
    granted += 1;
  }

  return { login, identityId, created, granted, alreadyPresent, actions: [...actions] };
}
