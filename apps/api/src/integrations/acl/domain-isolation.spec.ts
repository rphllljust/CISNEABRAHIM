import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CLIENTS_DOMAIN_DIR = path.resolve(__dirname, '../../clients/domain');
const FORBIDDEN_IMPORT_PATTERNS = [
  /integrations\/acl\/adapters/,
  /dygnus/i,
  /DygnusCustomerDto/,
];

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts'))
    .map((entry) => path.join(directory, entry.name));
}

describe('domain isolation', () => {
  it('keeps external vendor DTOs out of the clients domain', () => {
    const files = listTypeScriptFiles(CLIENTS_DOMAIN_DIR);
    expect(files.length).toBeGreaterThan(0);

    for (const filePath of files) {
      const source = readFileSync(filePath, 'utf8');
      for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
        expect(source).not.toMatch(pattern);
      }
    }
  });
});
