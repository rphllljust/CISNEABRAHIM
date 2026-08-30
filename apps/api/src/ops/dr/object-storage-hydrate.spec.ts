import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool } from 'pg';
import { describe, expect, it } from 'vitest';
import { hydrateObjectStorageForDr } from './object-storage-hydrate';

describe('object-storage-hydrate', () => {
  it('copies DB-referenced objects from canonical storage into isolated DR root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cisne-hydrate-'));
    const sourceRoot = join(root, 'canonical');
    const targetRoot = join(root, 'dr-isolated');
    const storageKey = 'objects/sample-doc.bin';

    await mkdir(join(sourceRoot, 'objects'), { recursive: true });
    await writeFile(join(sourceRoot, storageKey), Buffer.from('document-bytes'));

    const pool = {
      query: async () => ({ rows: [{ storage_key: storageKey }] }),
    } as unknown as Pool;

    const result = await hydrateObjectStorageForDr({
      pool,
      targetRoot,
      sourceRoot,
      sampleSize: 1,
    });

    expect(result.copied).toEqual([storageKey]);
    expect(result.missing).toEqual([]);
    expect(await readFile(join(targetRoot, storageKey))).toEqual(Buffer.from('document-bytes'));

    await rm(root, { recursive: true, force: true });
  });

  it('reports missing keys when source storage lacks referenced objects', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cisne-hydrate-miss-'));
    const targetRoot = join(root, 'dr-isolated');

    const pool = {
      query: async () => ({ rows: [{ storage_key: 'objects/absent.bin' }] }),
    } as unknown as Pool;

    const result = await hydrateObjectStorageForDr({
      pool,
      targetRoot,
      sourceRoot: join(root, 'canonical'),
      sampleSize: 1,
    });

    expect(result.copied).toEqual([]);
    expect(result.missing).toEqual(['objects/absent.bin']);

    await rm(root, { recursive: true, force: true });
  });
});
