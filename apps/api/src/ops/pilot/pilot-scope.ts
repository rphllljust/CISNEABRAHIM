import type { PilotScope } from './pilot-types';

const DEFAULT_ARCHETYPES = ['RENTAL', 'TRANSPORT', 'CIVIL_WORK'];

function readInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readList(env: NodeJS.ProcessEnv, key: string, fallback: string[]): string[] {
  const raw = env[key]?.trim();
  if (!raw) {
    return fallback;
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function loadPilotScope(env: NodeJS.ProcessEnv = process.env): PilotScope {
  return {
    maxUsers: readInt(env, 'PILOT_MAX_USERS', 5),
    maxActiveServiceOrders: readInt(env, 'PILOT_MAX_ACTIVE_SERVICE_ORDERS', 10),
    allowedArchetypes: readList(env, 'PILOT_ALLOWED_ARCHETYPES', DEFAULT_ARCHETYPES),
    allowedUnitIds: readList(env, 'PILOT_ALLOWED_UNIT_IDS', ['unit-pilot-a']),
    volumeCapPerWeek: readInt(env, 'PILOT_VOLUME_CAP_PER_WEEK', 20),
  };
}

export function assertPilotEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  if (env['CISNE_ENV'] !== 'pilot') {
    throw new Error('CISNE_ENV must be "pilot" for controlled pilot operation');
  }
  if (env['PILOT_PROGRAM_ENABLED'] !== 'true') {
    throw new Error('PILOT_PROGRAM_ENABLED=true is required to run the controlled pilot');
  }
}

export function assertPilotNotFullRollout(env: NodeJS.ProcessEnv = process.env): void {
  const scope = loadPilotScope(env);
  if (scope.maxUsers > 25 && env['PILOT_ALLOW_EXPANDED_USERS'] !== 'I_UNDERSTAND') {
    throw new Error(
      'Pilot user cap exceeds safe rollout threshold — set PILOT_ALLOW_EXPANDED_USERS=I_UNDERSTAND only after review',
    );
  }
  if (env['PILOT_MIGRATE_ALL_LEGACY_DATA'] === 'true') {
    throw new Error('Pilot must not migrate entire legacy operation at once');
  }
}

export function summarizePilotScope(scope: PilotScope): string {
  return `${scope.maxUsers} users; ${scope.maxActiveServiceOrders} active OS; archetypes=${scope.allowedArchetypes.join('|')}`;
}
