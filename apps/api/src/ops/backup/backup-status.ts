import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { BackupJobResult } from './backup-types';

export async function writeBackupStatus(statusFilePath: string, result: BackupJobResult): Promise<void> {
  await mkdir(dirname(statusFilePath), { recursive: true });
  const totalSize = result.artifacts.reduce((sum, artifact) => sum + artifact.sizeBytes, 0);
  const payload = {
    status: result.status,
    checkedAt: result.finishedAt,
    startedAt: result.startedAt,
    durationMs: result.durationMs,
    sizeBytes: totalSize,
    artifactCount: result.artifacts.length,
    artifacts: result.artifacts.map((artifact) => ({
      kind: artifact.kind,
      path: artifact.path,
      sizeBytes: artifact.sizeBytes,
      sha256: artifact.sha256,
      encrypted: artifact.encrypted,
    })),
    error: result.error ?? null,
  };
  await writeFile(statusFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export async function readBackupStatusFile(
  statusFilePath: string,
): Promise<{
  status: 'ok' | 'failed';
  checkedAt: string;
  durationMs: number;
  sizeBytes: number;
  artifactCount: number;
} | null> {
  try {
    const raw = await readFile(statusFilePath, 'utf8');
    const parsed = JSON.parse(raw) as {
      status?: string;
      checkedAt?: string;
      durationMs?: number;
      sizeBytes?: number;
      artifactCount?: number;
    };
    if (parsed.status !== 'ok' && parsed.status !== 'failed') {
      return null;
    }
    if (!parsed.checkedAt) {
      return null;
    }
    return {
      status: parsed.status,
      checkedAt: parsed.checkedAt,
      durationMs: parsed.durationMs ?? 0,
      sizeBytes: parsed.sizeBytes ?? 0,
      artifactCount: parsed.artifactCount ?? 0,
    };
  } catch {
    return null;
  }
}
