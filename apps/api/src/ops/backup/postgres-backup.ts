import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import type { BackupConfig } from './backup-config';
import type { BackupArtifact } from './backup-types';
import { decryptBuffer, encryptBuffer, sha256Hex } from './backup-crypto';

export type CommandRunner = (
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
) => Promise<{ stdout: string; stderr: string }>;

export function defaultCommandRunner(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} exited with code ${code}: ${stderr || stdout}`));
    });
  });
}

function parseDatabaseUrl(databaseUrl: string): { user: string; password: string; host: string; port: string; database: string } {
  const url = new URL(databaseUrl);
  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, ''),
  };
}

async function finalizeArtifact(
  rawPath: string,
  config: BackupConfig,
  kind: BackupArtifact['kind'],
): Promise<BackupArtifact> {
  const plain = await readFile(rawPath);
  const checksum = sha256Hex(plain);
  let finalPath = rawPath;
  let encrypted = false;

  if (config.encryptionKeyBase64) {
    const encryptedBuffer = encryptBuffer(plain, config.encryptionKeyBase64);
    finalPath = `${rawPath}.enc`;
    await writeFile(finalPath, encryptedBuffer);
    await rm(rawPath, { force: true });
    encrypted = true;
  }

  const stats = await readFile(finalPath);
  if (config.offsiteDir) {
    await mkdir(join(config.offsiteDir, kind), { recursive: true });
    const offsitePath = join(config.offsiteDir, kind, finalPath.split(/[/\\]/).pop() ?? 'artifact');
    await copyFile(finalPath, offsitePath);
  }

  return {
    kind,
    path: finalPath,
    sizeBytes: stats.byteLength,
    sha256: checksum,
    encrypted,
  };
}

export async function runPostgresBackup(
  config: BackupConfig,
  timestamp: string,
  runCommand: CommandRunner = defaultCommandRunner,
): Promise<BackupArtifact> {
  const outputDir = join(config.destinationDir, 'postgres', timestamp);
  await mkdir(outputDir, { recursive: true });
  const rawPath = join(outputDir, `postgres-${timestamp}.dump`);

  if (config.postgresBackupMode === 'docker') {
    const containerDump = `/tmp/cisne-backup-${timestamp}.dump`;
    const db = config.databaseUrl ? parseDatabaseUrl(config.databaseUrl) : null;
    const user = db?.user ?? 'cisne_local_dev';
    const database = db?.database ?? 'cisne_local_dev';
    await runCommand('docker', [
      'exec',
      config.dockerContainer,
      'pg_dump',
      '-U',
      user,
      '-d',
      database,
      '-Fc',
      '-f',
      containerDump,
    ]);
    await runCommand('docker', ['cp', `${config.dockerContainer}:${containerDump}`, rawPath]);
    await runCommand('docker', ['exec', config.dockerContainer, 'rm', '-f', containerDump]).catch(() => undefined);
  } else {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is required for pg_dump backup mode');
    }
    const db = parseDatabaseUrl(config.databaseUrl);
    await runCommand(
      'pg_dump',
      ['-h', db.host, '-p', db.port, '-U', db.user, '-d', db.database, '-Fc', '-f', rawPath],
      { ...process.env, PGPASSWORD: db.password },
    );
  }

  return finalizeArtifact(rawPath, config, 'postgres');
}

export async function verifyPostgresArtifactReadable(
  artifact: BackupArtifact,
  encryptionKeyBase64: string | null,
): Promise<boolean> {
  const payload = await readFile(artifact.path);
  const plain = artifact.encrypted
    ? encryptionKeyBase64
      ? decryptBuffer(payload, encryptionKeyBase64)
      : null
    : payload;
  if (!plain || plain.byteLength < 5) {
    return false;
  }
  // PostgreSQL custom format dump starts with "PGDMP"
  return plain.subarray(0, 5).toString('utf8') === 'PGDMP';
}
