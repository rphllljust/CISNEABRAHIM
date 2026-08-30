import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Load KEY=VALUE lines from a dotenv file into process.env (no external deps).
 */
export function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

/**
 * Resolve cisne-backend root from cisne-infra (or monorepo) working directory.
 */
export function resolveBackendDir(cwd = process.cwd()) {
  if (process.env['CISNE_BACKEND_DIR']) {
    return resolve(process.env['CISNE_BACKEND_DIR']);
  }

  const candidates = [
    resolve(cwd, '../../../cisne-backend'),
    resolve(cwd, '../cisne-backend'),
    resolve(cwd, '../..'),
    cwd,
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'apps', 'api', 'package.json'))) {
      return candidate;
    }
  }

  throw new Error(
    'cisne-backend not found. Clone it as a sibling of cisne-infra or set CISNE_BACKEND_DIR.',
  );
}

/**
 * Resolve cisne-infra root (compose, bootstrap scripts).
 */
export function resolveInfraDir(cwd = process.cwd()) {
  if (process.env['CISNE_INFRA_DIR']) {
    return resolve(process.env['CISNE_INFRA_DIR']);
  }

  const candidates = [
    cwd,
    resolve(cwd, '../cisne-infra'),
    resolve(cwd, '../../cisne-infra'),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'docker', 'hml', 'compose.yaml'))) {
      return candidate;
    }
  }

  throw new Error(
    'cisne-infra not found. Set CISNE_INFRA_DIR or run from the infra repository root.',
  );
}
