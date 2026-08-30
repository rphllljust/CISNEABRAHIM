import { Pool } from 'pg';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { loadBackupConfig } from '../backup/backup-config';
import { runMonitoredBackup } from '../backup/backup-runner';
import type { CommandRunner } from '../backup/postgres-backup';
import { defaultCommandRunner } from '../backup/postgres-backup';
import {
  assertDrIsolatedEnvironment,
  resolveDrDatabaseUrl,
  resolveDrObjectStorageRoot,
  resolveDrScenario,
  resolveObjectStorageSourceRoot,
} from './dr-config';
import { hydrateObjectStorageForDr } from './object-storage-hydrate';
import { measureDrMetrics } from './dr-metrics';
import { DR_SCENARIOS, type DrCheck, type DrDrillResult, type DrScenarioId } from './dr-types';
import {
  restoreObjectStorageFromArtifact,
  simulatePartialObjectStorageLoss,
  verifyRestoredObjectStorageManifest,
  wipeObjectStorageRoot,
} from './object-storage-restore';
import { preparePostgresDumpFile, restorePostgresDump } from './postgres-restore';
import { runDrVerification, writeDrStatusFile } from './dr-verify';

export type DrRunnerDeps = {
  now?: () => Date;
  runCommand?: CommandRunner;
  createPool?: (databaseUrl: string) => Pool;
  wipeDatabase?: (pool: Pool) => Promise<void>;
};

async function defaultWipeDatabase(pool: Pool): Promise<void> {
  await pool.query(`DO $$ DECLARE r RECORD; BEGIN
    FOR r IN (
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    )
    LOOP
      EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
  END $$;`);
}

export async function simulateDisaster(input: {
  scenario: DrScenarioId;
  pool: Pool | null;
  objectStorageRoot: string | null;
  wipeDatabase: (pool: Pool) => Promise<void>;
}): Promise<void> {
  const profile = DR_SCENARIOS[input.scenario];

  if (profile.restoresPostgres && input.pool && input.scenario !== 'application_host_loss') {
    if (input.scenario === 'db_loss' || input.scenario === 'bad_deployment' || input.scenario === 'credential_rotation') {
      await input.wipeDatabase(input.pool);
    }
  }

  if (input.objectStorageRoot) {
    if (input.scenario === 'object_storage_partial_loss') {
      await simulatePartialObjectStorageLoss(input.objectStorageRoot);
    } else if (profile.restoresObjectStorage && input.scenario === 'bad_deployment') {
      await wipeObjectStorageRoot(input.objectStorageRoot);
    }
  }
}

export async function runDrDrill(
  env: NodeJS.ProcessEnv = process.env,
  deps: DrRunnerDeps = {},
): Promise<DrDrillResult> {
  assertDrIsolatedEnvironment(env);
  const scenario = resolveDrScenario(env);
  const profile = DR_SCENARIOS[scenario];
  const startedAtDate = deps.now?.() ?? new Date();
  const startedAt = startedAtDate.toISOString();
  const isolatedRoot = env['DR_ISOLATED_ROOT']?.trim() ?? join('.backup', 'dr-drill');
  const statusFile = env['DR_STATUS_FILE']?.trim() ?? join(isolatedRoot, 'status', 'latest.json');

  const backupConfig = loadBackupConfig({
    ...env,
    BACKUP_DEST_DIR: join(isolatedRoot, 'artifacts'),
    OBJECT_STORAGE_ROOT: resolveDrObjectStorageRoot(env) ?? env['OBJECT_STORAGE_ROOT'],
  });

  const databaseUrl = resolveDrDatabaseUrl(env);
  const objectStorageRoot = resolveDrObjectStorageRoot(env);
  const runCommand = deps.runCommand ?? defaultCommandRunner;
  const createPool =
    deps.createPool ??
    ((url: string) => new Pool({ connectionString: url }));
  const wipeDatabase = deps.wipeDatabase ?? defaultWipeDatabase;

  let pool: Pool | null = null;
  const checks: DrCheck[] = [];

  try {
    await mkdir(isolatedRoot, { recursive: true });

    if (databaseUrl) {
      pool = createPool(databaseUrl);
    }

    if (pool && objectStorageRoot) {
      const sourceRoot = resolveObjectStorageSourceRoot(env);
      const hydration = await hydrateObjectStorageForDr({
        pool,
        targetRoot: objectStorageRoot,
        sourceRoot,
      });
      checks.push({
        id: 'object_storage_hydration',
        label: 'Document objects hydrated into DR storage root',
        passed: hydration.missing.length === 0,
        detail:
          hydration.missing.length === 0
            ? `copied=${hydration.copied.length}; already_present=${hydration.skipped.length}`
            : `missing=${hydration.missing.join(', ')}; source=${sourceRoot ?? 'none'}`,
      });
      if (hydration.missing.length > 0) {
        throw new Error(
          `DR object storage hydration failed: ${hydration.missing.length} DB-referenced object(s) absent from DR root and source`,
        );
      }
    }

    const backup = await runMonitoredBackup(
      {
        ...env,
        DATABASE_URL: databaseUrl ?? env['DATABASE_URL'],
        BACKUP_DEST_DIR: backupConfig.destinationDir,
        OBJECT_STORAGE_ROOT: backupConfig.objectStorageRoot ?? undefined,
      },
      { now: deps.now, runCommand },
    );
    if (backup.status !== 'ok') {
      throw new Error(`Backup prerequisite failed: ${backup.error ?? 'unknown'}`);
    }

    const disasterAtDate = deps.now?.() ?? new Date();
    const disasterAt = disasterAtDate.toISOString();

    await simulateDisaster({
      scenario,
      pool,
      objectStorageRoot,
      wipeDatabase,
    });

    if (profile.restoresPostgres && databaseUrl) {
      const postgresArtifact = backup.artifacts.find((artifact) => artifact.kind === 'postgres');
      if (!postgresArtifact) {
        throw new Error('Postgres backup artifact missing');
      }
      const dumpPath = await preparePostgresDumpFile(
        postgresArtifact,
        backupConfig.encryptionKeyBase64,
        join(isolatedRoot, 'work', 'postgres'),
      );
      await restorePostgresDump(
        databaseUrl,
        dumpPath,
        backupConfig.postgresBackupMode,
        backupConfig.dockerContainer,
        runCommand,
      );
    }

    if (profile.restoresObjectStorage && objectStorageRoot) {
      const objectArtifact = backup.artifacts.find((artifact) => artifact.kind === 'object_storage');
      if (!objectArtifact) {
        throw new Error('Object storage backup artifact missing');
      }
      const manifest = await restoreObjectStorageFromArtifact(
        objectArtifact,
        objectStorageRoot,
        backupConfig.encryptionKeyBase64,
        join(isolatedRoot, 'work', 'object-storage'),
      );
      const manifestCheck = await verifyRestoredObjectStorageManifest(objectStorageRoot, manifest);
      checks.push({
        id: 'object_storage_manifest',
        label: 'Object storage sample hash verification',
        passed: manifestCheck.passed,
        detail: manifestCheck.passed
          ? 'Sample hashes match manifest'
          : `missing=${manifestCheck.missing.join(',')}; mismatch=${manifestCheck.hashMismatches.join(',')}`,
      });
    }

    if (scenario === 'application_host_loss') {
      checks.push({
        id: 'application_host_loss',
        label: 'Application host loss — config-only recovery',
        passed: Boolean(databaseUrl && objectStorageRoot),
        detail: 'Validated minimal config (DB URL + object storage root) without data restore',
      });
    }

    if (pool) {
      checks.push(...(await runDrVerification(pool, objectStorageRoot)));
    }

    const restoreFinishedDate = deps.now?.() ?? new Date();
    const restoreFinishedAt = restoreFinishedDate.toISOString();
    const metrics = measureDrMetrics({
      backupFinishedAt: backup.finishedAt,
      disasterAt,
      restoreFinishedAt,
    });

    const passed = checks.every((check) => check.passed);
    const result: DrDrillResult = {
      status: passed ? 'PASS' : 'FAIL',
      scenario,
      startedAt,
      finishedAt: restoreFinishedAt,
      checks,
      metrics,
    };
    await writeDrStatusFile(statusFile, result);
    return result;
  } catch (error) {
    const finishedAt = (deps.now?.() ?? new Date()).toISOString();
    const result: DrDrillResult = {
      status: 'FAIL',
      scenario,
      startedAt,
      finishedAt,
      checks,
      metrics: measureDrMetrics({
        backupFinishedAt: startedAt,
        disasterAt: startedAt,
        restoreFinishedAt: finishedAt,
      }),
      error: error instanceof Error ? error.message : String(error),
    };
    await writeDrStatusFile(statusFile, result);
    return result;
  } finally {
    if (pool) {
      await pool.end();
    }
    if (env['DR_CLEANUP_ISOLATED'] === 'true') {
      await rm(isolatedRoot, { recursive: true, force: true });
    }
  }
}
