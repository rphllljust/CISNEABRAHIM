import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { BackupConfig } from './backup-config';
import type { BackupArtifact } from './backup-types';
import { encryptBuffer, sha256Hex } from './backup-crypto';

type ManifestEntry = {
  relativePath: string;
  sizeBytes: number;
  sha256: string;
};

async function walkFiles(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(root, fullPath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function buildManifest(sourceRoot: string, files: string[]): Promise<ManifestEntry[]> {
  const manifest: ManifestEntry[] = [];
  for (const filePath of files) {
    const buffer = await readFile(filePath);
    manifest.push({
      relativePath: relative(sourceRoot, filePath).replace(/\\/g, '/'),
      sizeBytes: buffer.byteLength,
      sha256: sha256Hex(buffer),
    });
  }
  return manifest.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

export async function runObjectStorageBackup(
  config: BackupConfig,
  timestamp: string,
): Promise<BackupArtifact> {
  if (!config.objectStorageRoot) {
    throw new Error('OBJECT_STORAGE_ROOT is required for object storage backup');
  }

  const outputDir = join(config.destinationDir, 'object-storage', timestamp);
  const snapshotDir = join(outputDir, 'snapshot');
  await mkdir(snapshotDir, { recursive: true });

  const sourceFiles = await walkFiles(config.objectStorageRoot);
  for (const sourcePath of sourceFiles) {
    const relativePath = relative(config.objectStorageRoot, sourcePath);
    const targetPath = join(snapshotDir, relativePath);
    await mkdir(join(targetPath, '..'), { recursive: true });
    await copyFile(sourcePath, targetPath);
  }

  const manifest = await buildManifest(snapshotDir, await walkFiles(snapshotDir));
  const manifestPath = join(outputDir, 'manifest.json');
  await writeFile(manifestPath, `${JSON.stringify({ generatedAt: timestamp, entries: manifest }, null, 2)}\n`);

  const archivePath = join(outputDir, `object-storage-${timestamp}.tar`);
  await createTarArchive(snapshotDir, archivePath);

  let finalPath = archivePath;
  let encrypted = false;
  const plain = await readFile(archivePath);
  const checksum = sha256Hex(plain);

  if (config.encryptionKeyBase64) {
    const encryptedBuffer = encryptBuffer(plain, config.encryptionKeyBase64);
    finalPath = `${archivePath}.enc`;
    await writeFile(finalPath, encryptedBuffer);
    encrypted = true;
  }

  const fileStats = await stat(finalPath);
  if (config.offsiteDir) {
    await mkdir(join(config.offsiteDir, 'object_storage'), { recursive: true });
    const offsitePath = join(config.offsiteDir, 'object_storage', finalPath.split(/[/\\]/).pop() ?? 'artifact');
    await copyFile(finalPath, offsitePath);
  }

  return {
    kind: 'object_storage',
    path: finalPath,
    sizeBytes: fileStats.size,
    sha256: checksum,
    encrypted,
  };
}

async function createTarArchive(sourceDir: string, archivePath: string): Promise<void> {
  const { spawn } = await import('node:child_process');
  await new Promise<void>((resolve, reject) => {
    const child = spawn('tar', ['-cf', archivePath, '-C', sourceDir, '.'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`tar exited with code ${code}: ${stderr}`));
    });
  });
}

export async function verifyObjectStorageArtifactAccessible(artifactPath: string): Promise<boolean> {
  const stats = await stat(artifactPath);
  return stats.isFile() && stats.size > 0;
}
