import { DEVELOPMENT_SEED_LOGIN } from '@cisne/database';

export function resolveSeedOperatorLogin(env: NodeJS.ProcessEnv = process.env): string {
  if (env['CISNE_ENV'] === 'hml') {
    return (env['HML_SMOKE_LOGIN'] ?? env['BOOTSTRAP_ADMIN_LOGIN'] ?? '').trim().toLowerCase();
  }
  return (env['DEV_OPERATOR_LOGIN'] ?? DEVELOPMENT_SEED_LOGIN).trim().toLowerCase();
}