import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(process.cwd(), '..', '..');
const SCAN_ROOTS = ['apps/api/src', 'apps/web/src', 'packages'];

const SECRET_PATTERNS: RegExp[] = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk_live_[0-9a-zA-Z]{16,}\b/,
  /\bghp_[0-9a-zA-Z]{20,}\b/,
  /\bJWT_SECRET\s*=\s*['"][^'"]{8,}['"]/,
];

const ALLOWLIST_PATH_FRAGMENTS = [
  'secret-scan.spec.ts',
  '.spec.ts',
  '.test.ts',
  '.test.tsx',
  'auth-test-env.ts',
  'token.service.adversarial.spec.ts',
];

function collectSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.object-storage-test') {
        continue;
      }
      collectSourceFiles(fullPath, files);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|json|env\.example)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

function isAllowlisted(path: string): boolean {
  return ALLOWLIST_PATH_FRAGMENTS.some((fragment) => path.includes(fragment));
}

describe('secret-scan', () => {
  it('does not contain known secret patterns in tracked source', () => {
    const violations: string[] = [];

    for (const root of SCAN_ROOTS) {
      const absoluteRoot = join(REPO_ROOT, root);
      for (const file of collectSourceFiles(absoluteRoot)) {
        const rel = relative(REPO_ROOT, file).replace(/\\/g, '/');
        if (isAllowlisted(rel)) {
          continue;
        }
        const content = readFileSync(file, 'utf8');
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(content)) {
            violations.push(`${rel} matched ${pattern}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
