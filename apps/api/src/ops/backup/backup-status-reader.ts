import { readFileSync } from 'node:fs';
import type { BackupStatusSnapshot } from './backup-types';
import { readBackupStatusFile } from './backup-status';

export function readBackupStatusSnapshot(env: NodeJS.ProcessEnv = process.env): BackupStatusSnapshot {
  const statusFile = env['BACKUP_STATUS_FILE']?.trim();
  if (statusFile) {
    try {
      const raw = readFileSync(statusFile, 'utf8');
      const parsed = JSON.parse(raw) as {
        status?: string;
        checkedAt?: string;
        durationMs?: number;
        sizeBytes?: number;
        artifactCount?: number;
      };
      if ((parsed.status === 'ok' || parsed.status === 'failed') && parsed.checkedAt) {
        return {
          status: parsed.status,
          checkedAt: parsed.checkedAt,
          durationMs: parsed.durationMs ?? null,
          sizeBytes: parsed.sizeBytes ?? null,
          artifactCount: parsed.artifactCount ?? null,
        };
      }
    } catch {
      // fall through to env-based status
    }
  }

  const statusRaw = env['TECH_BACKUP_LAST_STATUS']?.trim().toLowerCase();
  const checkedAt = env['TECH_BACKUP_LAST_CHECKED_AT']?.trim() ?? null;
  const durationMs = env['TECH_BACKUP_LAST_DURATION_MS']
    ? Number.parseInt(env['TECH_BACKUP_LAST_DURATION_MS'], 10)
    : null;
  const sizeBytes = env['TECH_BACKUP_LAST_SIZE_BYTES']
    ? Number.parseInt(env['TECH_BACKUP_LAST_SIZE_BYTES'], 10)
    : null;
  const artifactCount = env['TECH_BACKUP_LAST_ARTIFACT_COUNT']
    ? Number.parseInt(env['TECH_BACKUP_LAST_ARTIFACT_COUNT'], 10)
    : null;

  if (!statusRaw) {
    return {
      status: 'unknown',
      checkedAt,
      durationMs,
      sizeBytes,
      artifactCount,
    };
  }
  if (statusRaw === 'failed' || statusRaw === 'failure') {
    return {
      status: 'failed',
      checkedAt,
      durationMs,
      sizeBytes,
      artifactCount,
    };
  }
  return {
    status: 'ok',
    checkedAt,
    durationMs,
    sizeBytes,
    artifactCount,
  };
}

export async function readBackupStatusSnapshotAsync(
  env: NodeJS.ProcessEnv = process.env,
): Promise<BackupStatusSnapshot> {
  const statusFile = env['BACKUP_STATUS_FILE']?.trim();
  if (!statusFile) {
    return readBackupStatusSnapshot(env);
  }
  const fromFile = await readBackupStatusFile(statusFile);
  if (!fromFile) {
    return readBackupStatusSnapshot(env);
  }
  return {
    status: fromFile.status,
    checkedAt: fromFile.checkedAt,
    durationMs: fromFile.durationMs,
    sizeBytes: fromFile.sizeBytes,
    artifactCount: fromFile.artifactCount,
  };
}

export async function verifyBackupArtifactChecksum(
  artifactPath: string,
  expectedSha256: string,
): Promise<boolean> {
  const { readFile } = await import('node:fs/promises');
  const buffer = await readFile(artifactPath);
  const { sha256Hex } = await import('./backup-crypto');
  return sha256Hex(buffer) === expectedSha256;
}
