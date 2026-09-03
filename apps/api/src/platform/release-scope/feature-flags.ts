import { FEATURE_FLAG_ENV, GATED_MODULE_IDS, type GatedModuleId } from './release-1-scope';

export function isReleaseModuleEnabled(
  moduleId: GatedModuleId,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env[FEATURE_FLAG_ENV[moduleId]] === 'true';
}

export function listReleaseFeatureFlags(
  env: NodeJS.ProcessEnv = process.env,
): Record<GatedModuleId, boolean> {
  return Object.fromEntries(
    GATED_MODULE_IDS.map((moduleId) => [moduleId, isReleaseModuleEnabled(moduleId, env)]),
  ) as Record<GatedModuleId, boolean>;
}
