import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readBackupStatusSnapshot } from './backup-status-reader';
import { writeBackupStatus } from './backup-status';

describe('backup-status-reader', () => {
  it('reads success metrics from status file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cisne-backup-status-'));
    const statusFile = join(dir, 'latest.json');
    await writeBackupStatus(statusFile, {
      status: 'ok',
      startedAt: '2026-08-30T00:00:00.000Z',
      finishedAt: '2026-08-30T00:00:05.000Z',
      durationMs: 5000,
      artifacts: [
        {
          kind: 'postgres',
          path: join(dir, 'postgres.dump'),
          sizeBytes: 1024,
          sha256: 'abc',
          encrypted: false,
        },
      ],
    });

    const snapshot = readBackupStatusSnapshot({
      BACKUP_STATUS_FILE: statusFile,
    });
    expect(snapshot.status).toBe('ok');
    expect(snapshot.checkedAt).toBe('2026-08-30T00:00:05.000Z');
    expect(snapshot.durationMs).toBe(5000);
    expect(snapshot.sizeBytes).toBe(1024);
    expect(snapshot.artifactCount).toBe(1);

    await rm(dir, { recursive: true, force: true });
  });

  it('falls back to TECH_BACKUP_LAST_STATUS env when file missing', () => {
    const snapshot = readBackupStatusSnapshot({
      TECH_BACKUP_LAST_STATUS: 'failed',
      TECH_BACKUP_LAST_CHECKED_AT: '2026-08-30T01:00:00.000Z',
      TECH_BACKUP_LAST_DURATION_MS: '1200',
      TECH_BACKUP_LAST_SIZE_BYTES: '4096',
      TECH_BACKUP_LAST_ARTIFACT_COUNT: '2',
    });
    expect(snapshot.status).toBe('failed');
    expect(snapshot.durationMs).toBe(1200);
    expect(snapshot.sizeBytes).toBe(4096);
    expect(snapshot.artifactCount).toBe(2);
  });
});
