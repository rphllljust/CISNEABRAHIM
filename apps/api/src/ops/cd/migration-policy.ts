import { existsSync } from 'node:fs';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { MigrationAssessment, MigrationRisk } from './cd-types';

function findMigrationsDirectory(): string {
  const candidates = [
    resolve(process.cwd(), 'packages/database/migrations'),
    resolve(process.cwd(), '../../packages/database/migrations'),
  ];
  const found = candidates.find((dir) => existsSync(dir));
  if (!found) {
    throw new Error('packages/database/migrations not found');
  }
  return found;
}

const BREAKING_PATTERNS: Array<{ pattern: RegExp; rationale: string }> = [
  { pattern: /\bDROP\s+TABLE\b/i, rationale: 'DROP TABLE is destructive' },
  { pattern: /\bDROP\s+COLUMN\b/i, rationale: 'DROP COLUMN requires expand/contract' },
  { pattern: /\bTRUNCATE\b/i, rationale: 'TRUNCATE is destructive' },
  { pattern: /\bALTER\s+COLUMN\b/i, rationale: 'ALTER COLUMN may break old application code' },
  { pattern: /\bDROP\s+CONSTRAINT\b/i, rationale: 'DROP CONSTRAINT can break compatibility' },
];

const COMPATIBLE_PATTERNS: Array<{ pattern: RegExp; rationale: string }> = [
  { pattern: /\bADD\s+COLUMN\b/i, rationale: 'ADD COLUMN is expand-phase compatible' },
  { pattern: /\bCREATE\s+(UNIQUE\s+)?INDEX\b/i, rationale: 'CREATE INDEX is backward-compatible' },
  { pattern: /\bCREATE\s+TABLE\b/i, rationale: 'CREATE TABLE is additive' },
];

function classifySql(sql: string, file: string): MigrationAssessment {
  for (const rule of BREAKING_PATTERNS) {
    if (rule.pattern.test(sql)) {
      return { file, risk: 'breaking-high-risk', rationale: rule.rationale };
    }
  }
  for (const rule of COMPATIBLE_PATTERNS) {
    if (rule.pattern.test(sql)) {
      return { file, risk: 'backward-compatible', rationale: rule.rationale };
    }
  }
  return { file, risk: 'backward-compatible', rationale: 'No destructive pattern detected' };
}

export function assessMigrationFile(filePath: string): MigrationAssessment {
  const sql = readFileSync(filePath, 'utf8');
  return classifySql(sql, filePath.split(/[/\\]/).pop() ?? filePath);
}

export function assessMigrationsDirectory(migrationsDir = findMigrationsDirectory()): MigrationAssessment[] {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => join(migrationsDir, name));
  return files.map((file) => assessMigrationFile(file));
}

export function assertSafeMigrationDeploy(
  assessments: MigrationAssessment[],
  allowBreaking: boolean,
): void {
  const breaking = assessments.filter((entry) => entry.risk === 'breaking-high-risk');
  if (breaking.length > 0 && !allowBreaking) {
    const names = breaking.map((entry) => entry.file).join(', ');
    throw new Error(
      `Breaking/high-risk migrations detected (${names}). Use expand/contract or set CD_ALLOW_BREAKING_MIGRATIONS=I_UNDERSTAND with coordinated deploy.`,
    );
  }
}

export function summarizeMigrationRisk(assessments: MigrationAssessment[]): Record<MigrationRisk, number> {
  return assessments.reduce(
    (acc, entry) => {
      acc[entry.risk] += 1;
      return acc;
    },
    { 'backward-compatible': 0, 'breaking-high-risk': 0 } as Record<MigrationRisk, number>,
  );
}
