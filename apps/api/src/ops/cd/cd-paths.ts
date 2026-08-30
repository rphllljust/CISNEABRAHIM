import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

export function findRepoRoot(): string {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), '..'),
    resolve(process.cwd(), '../..'),
    resolve(process.cwd(), '../../..'),
  ];
  for (const base of candidates) {
    if (existsSync(resolve(base, 'package.json')) && existsSync(resolve(base, 'apps/api'))) {
      return base;
    }
  }
  return process.cwd();
}

export function resolveArtifactPath(path: string): string {
  if (isAbsolute(path)) {
    return path;
  }
  const resolved = resolve(findRepoRoot(), path);
  if (!existsSync(resolved)) {
    throw new Error(`Artifact path not found: ${path} (resolved to ${resolved})`);
  }
  return resolved;
}

export function resolveArtifactPaths(paths: string[]): string[] {
  return paths.map(resolveArtifactPath);
}
