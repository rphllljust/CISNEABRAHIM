import { readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

export type RetentionEntry = {
  path: string;
  mtimeMs: number;
};

export async function listTimestampedBackups(rootDir: string): Promise<RetentionEntry[]> {
  try {
    const entries = await readdir(rootDir, { withFileTypes: true });
    const result: RetentionEntry[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const path = join(rootDir, entry.name);
      const stats = await stat(path);
      result.push({ path, mtimeMs: stats.mtimeMs });
    }
    return result.sort((left, right) => right.mtimeMs - left.mtimeMs);
  } catch {
    return [];
  }
}

/**
 * Engineering retention only — not legal/document retention (DDP-019).
 * Keeps newest N daily backups; weekly count is advisory for operators.
 */
export function selectBackupsForPruning(
  entries: RetentionEntry[],
  retentionDaily: number,
): RetentionEntry[] {
  if (retentionDaily <= 0) {
    return entries;
  }
  return entries.slice(retentionDaily);
}

export async function pruneBackups(rootDir: string, retentionDaily: number): Promise<number> {
  const entries = await listTimestampedBackups(rootDir);
  const toRemove = selectBackupsForPruning(entries, retentionDaily);
  let removed = 0;
  for (const entry of toRemove) {
    await rm(entry.path, { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}
