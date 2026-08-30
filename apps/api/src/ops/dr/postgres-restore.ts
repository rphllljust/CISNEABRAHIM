import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BackupArtifact } from '../backup/backup-types';
import { decryptBuffer } from '../backup/backup-crypto';
import type { CommandRunner } from '../backup/postgres-backup';
import { defaultCommandRunner } from '../backup/postgres-backup';

function parseDatabaseUrl(databaseUrl: string): {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
} {
  const url = new URL(databaseUrl);
  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, ''),
  };
}

export async function preparePostgresDumpFile(
  artifact: BackupArtifact,
  encryptionKeyBase64: string | null,
  workDir: string,
): Promise<string> {
  await mkdir(workDir, { recursive: true });
  const payload = await readFile(artifact.path);
  const plain = artifact.encrypted
    ? encryptionKeyBase64
      ? decryptBuffer(payload, encryptionKeyBase64)
      : null
    : payload;
  if (!plain) {
    throw new Error('Encrypted postgres backup requires BACKUP_ENCRYPTION_KEY');
  }
  const dumpPath = join(workDir, 'restore.dump');
  await writeFile(dumpPath, plain);
  return dumpPath;
}

export async function restorePostgresDump(
  databaseUrl: string,
  dumpPath: string,
  mode: 'pg_dump' | 'docker',
  dockerContainer: string,
  runCommand: CommandRunner = defaultCommandRunner,
): Promise<void> {
  const db = parseDatabaseUrl(databaseUrl);

  if (mode === 'docker') {
    const containerDump = '/tmp/cisne-dr-restore.dump';
    await runCommand('docker', ['cp', dumpPath, `${dockerContainer}:${containerDump}`]);
    await runCommand('docker', [
      'exec',
      dockerContainer,
      'pg_restore',
      '-U',
      db.user,
      '-d',
      db.database,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-acl',
      containerDump,
    ]);
    await runCommand('docker', ['exec', dockerContainer, 'rm', '-f', containerDump]).catch(() => undefined);
    return;
  }

  await runCommand(
    'pg_restore',
    [
      '-h',
      db.host,
      '-p',
      db.port,
      '-U',
      db.user,
      '-d',
      db.database,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-acl',
      dumpPath,
    ],
    { ...process.env, PGPASSWORD: db.password },
  );
}
