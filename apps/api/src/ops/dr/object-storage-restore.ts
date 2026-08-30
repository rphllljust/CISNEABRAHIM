import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { spawn } from 'node:child_process';
import type { BackupArtifact } from '../backup/backup-types';
import { decryptBuffer, sha256Hex } from '../backup/backup-crypto';

type ManifestFile = {
  generatedAt: string;
  entries: Array<{ relativePath: string; sizeBytes: number; sha256: string }>;
};

export async function restoreObjectStorageFromArtifact(
  artifact: BackupArtifact,
  targetRoot: string,
  encryptionKeyBase64: string | null,
  workDir: string,
): Promise<ManifestFile> {
  await mkdir(workDir, { recursive: true });
  const payload = await readFile(artifact.path);
  const plain = artifact.encrypted
    ? encryptionKeyBase64
      ? decryptBuffer(payload, encryptionKeyBase64)
      : null
    : payload;
  if (!plain) {
    throw new Error('Encrypted object storage backup requires BACKUP_ENCRYPTION_KEY');
  }

  const tarPath = join(workDir, 'restore.tar');
  await writeFile(tarPath, plain);
  await mkdir(targetRoot, { recursive: true });
  await extractTarArchive(tarPath, targetRoot);

  const manifestPath = join(dirname(artifact.path), 'manifest.json');
  const manifestRaw = await readFile(manifestPath, 'utf8');
  return JSON.parse(manifestRaw) as ManifestFile;
}

async function extractTarArchive(archivePath: string, targetDir: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('tar', ['-xf', archivePath, '-C', targetDir], {
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
      reject(new Error(`tar extract exited with code ${code}: ${stderr}`));
    });
  });
}

export async function verifyRestoredObjectStorageManifest(
  targetRoot: string,
  manifest: ManifestFile,
  sampleSize = 5,
): Promise<{ passed: boolean; missing: string[]; hashMismatches: string[] }> {
  const sample = manifest.entries.slice(0, sampleSize);
  const missing: string[] = [];
  const hashMismatches: string[] = [];

  for (const entry of sample) {
    const filePath = join(targetRoot, entry.relativePath);
    try {
      const buffer = await readFile(filePath);
      const hash = sha256Hex(buffer);
      if (hash !== entry.sha256) {
        hashMismatches.push(entry.relativePath);
      }
    } catch {
      missing.push(entry.relativePath);
    }
  }

  return {
    passed: missing.length === 0 && hashMismatches.length === 0,
    missing,
    hashMismatches,
  };
}

export async function simulatePartialObjectStorageLoss(
  targetRoot: string,
  deleteRatio = 0.5,
): Promise<number> {
  const files = await walkFiles(targetRoot);
  const toDelete = files.filter((_, index) => index % Math.max(1, Math.floor(1 / deleteRatio)) === 0);
  for (const filePath of toDelete) {
    await rm(filePath, { force: true });
  }
  return toDelete.length;
}

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

export async function wipeObjectStorageRoot(targetRoot: string): Promise<void> {
  await rm(targetRoot, { recursive: true, force: true });
  await mkdir(targetRoot, { recursive: true });
}
