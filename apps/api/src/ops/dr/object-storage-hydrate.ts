import { access, copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Pool } from 'pg';

export const DOCUMENT_INTEGRITY_SAMPLE_SIZE = 5;

export async function listDocumentStorageKeys(
  pool: Pool,
  sampleSize = DOCUMENT_INTEGRITY_SAMPLE_SIZE,
): Promise<string[]> {
  const result = await pool.query<{ storage_key: string }>(
    `SELECT s.storage_key
     FROM doc.stored_objects s
     INNER JOIN doc.document_versions dv ON dv.stored_object_id = s.id
     ORDER BY dv.published_at DESC
     LIMIT $1`,
    [sampleSize],
  );
  return result.rows.map((row) => row.storage_key);
}

export type ObjectStorageHydrationResult = {
  copied: string[];
  skipped: string[];
  missing: string[];
};

/**
 * Ensures DB-referenced document objects exist in the DR backup source root.
 * Copies from the canonical object storage when the isolated DR root is empty or partial.
 */
export async function hydrateObjectStorageForDr(input: {
  pool: Pool;
  targetRoot: string;
  sourceRoot: string | null;
  sampleSize?: number;
}): Promise<ObjectStorageHydrationResult> {
  const keys = await listDocumentStorageKeys(input.pool, input.sampleSize ?? DOCUMENT_INTEGRITY_SAMPLE_SIZE);
  const copied: string[] = [];
  const skipped: string[] = [];
  const missing: string[] = [];

  for (const storageKey of keys) {
    const targetPath = join(input.targetRoot, storageKey);
    try {
      await access(targetPath);
      skipped.push(storageKey);
      continue;
    } catch {
      // object absent from DR root — attempt copy from canonical storage
    }

    if (!input.sourceRoot || input.sourceRoot === input.targetRoot) {
      missing.push(storageKey);
      continue;
    }

    const sourcePath = join(input.sourceRoot, storageKey);
    try {
      await access(sourcePath);
      await mkdir(dirname(targetPath), { recursive: true });
      await copyFile(sourcePath, targetPath);
      copied.push(storageKey);
    } catch {
      missing.push(storageKey);
    }
  }

  return { copied, skipped, missing };
}
