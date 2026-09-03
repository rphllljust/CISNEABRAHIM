import { FEATURE_FLAG_ENV, type GatedModuleId } from './release-1-scope';

type FlagEnv = Record<string, string | undefined>;

function readViteEnv(): FlagEnv {
  return import.meta.env as FlagEnv;
}

export function isReleaseModuleEnabled(moduleId: GatedModuleId, env: FlagEnv = readViteEnv()): boolean {
  return env[FEATURE_FLAG_ENV[moduleId]] === 'true';
}
