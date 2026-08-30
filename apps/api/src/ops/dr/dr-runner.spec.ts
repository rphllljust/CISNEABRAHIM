import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool } from 'pg';
import { assertDrIsolatedEnvironment, resolveDrScenario } from './dr-config';
import { backupApprovedByRestore, formatDrMetricsSummary, measureDrMetrics } from './dr-metrics';
import { runDrDrill, simulateDisaster } from './dr-runner';
import { DR_SCENARIOS } from './dr-types';
import { verifyDocumentObjectIntegrity } from './dr-verify';
import { runMonitoredBackup } from '../backup/backup-runner';
import {
  restoreObjectStorageFromArtifact,
  verifyRestoredObjectStorageManifest,
  wipeObjectStorageRoot,
} from './object-storage-restore';

describe('DR drill (Prompt 85)', () => {
  it('blocks non-isolated production-like database URLs', () => {
    expect(() =>
      assertDrIsolatedEnvironment({
        NODE_ENV: 'production',
        DR_DATABASE_URL: 'postgresql://user:pass@prod-db:5432/cisne_production',
      }),
    ).toThrow(/blocked/);
  });

  it('documents all required disaster scenarios', () => {
    expect(Object.keys(DR_SCENARIOS)).toEqual([
      'db_loss',
      'application_host_loss',
      'object_storage_partial_loss',
      'bad_deployment',
      'credential_rotation',
    ]);
  });

  it('proves backup is not approved until restore passes', async () => {
    const backup = {
      status: 'ok' as const,
      startedAt: 't0',
      finishedAt: 't1',
      durationMs: 1,
      artifacts: [],
    };
    expect(backupApprovedByRestore(backup, { status: 'FAIL' })).toBe(false);
    expect(backupApprovedByRestore(backup, { status: 'PASS' })).toBe(true);
  });

  it('runs full restore drill on isolated object storage with checksum verification', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cisne-dr-'));
    const objectRoot = join(root, 'objects');
    const isolatedRoot = join(root, 'dr');
    const encryptionKey = randomBytes(32).toString('base64');

    await mkdir(join(objectRoot, 'billing'), { recursive: true });
    await mkdir(join(objectRoot, 'evidence'), { recursive: true });
    await writeFile(join(objectRoot, 'billing', 'invoice.pdf'), Buffer.from('%PDF-billing'));
    await writeFile(join(objectRoot, 'evidence', 'photo.jpg'), Buffer.from('jpeg-evidence'));

    const backup = await runMonitoredBackup({
      BACKUP_DEST_DIR: join(isolatedRoot, 'artifacts'),
      BACKUP_STATUS_FILE: join(isolatedRoot, 'backup-status.json'),
      BACKUP_ENCRYPTION_KEY: encryptionKey,
      OBJECT_STORAGE_ROOT: objectRoot,
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/cisne',
      BACKUP_ENABLE_POSTGRES: 'true',
      BACKUP_ENABLE_OBJECT_STORAGE: 'true',
    }, {
      runCommand: async (_cmd, args) => {
        const outputFlagIndex = args.indexOf('-f');
        const outputPath = outputFlagIndex >= 0 ? (args[outputFlagIndex + 1] ?? join(root, 'fake.dump')) : join(root, 'fake.dump');
        await mkdir(join(outputPath, '..'), { recursive: true });
        await writeFile(outputPath, Buffer.from('PGDMP-fake'));
        return { stdout: '', stderr: '' };
      },
    });
    expect(backup.status).toBe('ok');

    await wipeObjectStorageRoot(objectRoot);
    const objectArtifact = backup.artifacts.find((artifact) => artifact.kind === 'object_storage');
    expect(objectArtifact).toBeDefined();

    const manifest = await restoreObjectStorageFromArtifact(
      objectArtifact!,
      objectRoot,
      encryptionKey,
      join(isolatedRoot, 'work'),
    );
    const manifestCheck = await verifyRestoredObjectStorageManifest(objectRoot, manifest);
    expect(manifestCheck.passed).toBe(true);
    expect(await readFile(join(objectRoot, 'billing', 'invoice.pdf'))).toBeDefined();

    const metrics = measureDrMetrics({
      backupFinishedAt: backup.finishedAt,
      disasterAt: backup.finishedAt,
      restoreFinishedAt: new Date().toISOString(),
    });
    expect(metrics.rpoTarget).toBe('TARGET_NOT_DEFINED');
    expect(formatDrMetricsSummary(metrics)).toContain('RPO measured');

    await rm(root, { recursive: true, force: true });
  });

  it('runs monitored DR drill with mocked postgres restore and verification', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cisne-dr-runner-'));
    const objectRoot = join(root, 'objects');
    const encryptionKey = randomBytes(32).toString('base64');
    const databaseUrl = 'postgresql://cisne_local_dev:pass@127.0.0.1:5432/cisne_dr_sandbox';

    await mkdir(join(objectRoot, 'docs'), { recursive: true });
    await writeFile(join(objectRoot, 'docs', 'file.bin'), Buffer.from('doc-content'));

    const pool = {
      query: async (sql: string) => {
        if (sql.includes('information_schema.schemata')) {
          return { rowCount: 6, rows: [] };
        }
        if (sql.includes('schema_baseline')) {
          return { rows: [{ count: '1' }] };
        }
        if (sql.includes('doc.stored_objects s') && sql.includes('ORDER BY')) {
          return { rows: [] };
        }
        if (sql.includes('doc.documents d') || sql.includes('bil.billing_documents')) {
          return { rows: [{ count: '0' }] };
        }
        if (sql.includes('identity.identities')) {
          return { rows: [{ count: '1' }] };
        }
        return { rows: [{ count: '1' }] };
      },
      end: async () => undefined,
    } as unknown as Pool;

    const result = await runDrDrill(
      {
        DR_ISOLATED_ROOT: join(root, 'dr'),
        DR_STATUS_FILE: join(root, 'dr-status.json'),
        DR_DATABASE_URL: databaseUrl,
        DR_OBJECT_STORAGE_ROOT: objectRoot,
        DR_SCENARIO: 'bad_deployment',
        BACKUP_ENCRYPTION_KEY: encryptionKey,
        BACKUP_ENABLE_POSTGRES: 'true',
        BACKUP_ENABLE_OBJECT_STORAGE: 'true',
      },
      {
        createPool: () => pool,
        wipeDatabase: async () => undefined,
        runCommand: async (cmd, args) => {
          if (cmd === 'pg_restore') {
            return { stdout: '', stderr: '' };
          }
          const outputFlagIndex = args.indexOf('-f');
          if (outputFlagIndex >= 0) {
            const outputPath = args[outputFlagIndex + 1] ?? join(root, 'fake.dump');
            await mkdir(join(outputPath, '..'), { recursive: true });
            await writeFile(outputPath, Buffer.from('PGDMP-fake'));
          }
          return { stdout: '', stderr: '' };
        },
      },
    );

    expect(result.status).toBe('PASS');
    expect(result.checks.some((check) => check.id === 'object_storage_manifest' && check.passed)).toBe(true);
    expect(result.checks.some((check) => check.id === 'login_capability' && check.passed)).toBe(true);
    expect(result.metrics.slaComparison).toBe('PENDING_BUSINESS_APPROVAL');

    await rm(root, { recursive: true, force: true });
  });

  it('detects missing document objects after partial storage loss', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cisne-dr-doc-'));
    const objectRoot = join(root, 'objects');
    await mkdir(objectRoot, { recursive: true });
    await writeFile(join(objectRoot, 'missing-key'), Buffer.from('x'));

    const pool = {
      query: async () => ({ rows: [{ storage_key: 'absent/object' }] }),
    } as unknown as Pool;

    const check = await verifyDocumentObjectIntegrity(pool, objectRoot, 1);
    expect(check.passed).toBe(false);
    expect(check.detail).toContain('Missing objects');

    await rm(root, { recursive: true, force: true });
  });

  it('simulates db_loss scenario profile', async () => {
    const scenario = resolveDrScenario({ DR_SCENARIO: 'db_loss' });
    expect(DR_SCENARIOS[scenario].restoresPostgres).toBe(true);
    let wiped = false;
    const pool = { query: async () => ({ rows: [] }), end: async () => undefined } as unknown as Pool;
    await simulateDisaster({
      scenario: 'db_loss',
      pool,
      objectStorageRoot: null,
      wipeDatabase: async () => {
        wiped = true;
      },
    });
    expect(wiped).toBe(true);
  });
});
