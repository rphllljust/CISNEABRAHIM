import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type {
  ObjectStorageGetResult,
  ObjectStoragePort,
  StoredObjectPayload,
} from './object-storage.port';

export class FilesystemObjectStorage implements ObjectStoragePort {
  constructor(private readonly rootPath: string) {}

  private objectPath(storageKey: string): string {
    return join(this.rootPath, storageKey);
  }

  async putObject(payload: StoredObjectPayload): Promise<void> {
    const filePath = this.objectPath(payload.storageKey);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, payload.buffer);
  }

  async getObject(storageKey: string): Promise<ObjectStorageGetResult | null> {
    try {
      const buffer = await readFile(this.objectPath(storageKey));
      return { buffer, mimeType: 'application/octet-stream' };
    } catch {
      return null;
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    try {
      await rm(this.objectPath(storageKey), { force: true });
    } catch {
      // Best-effort cleanup.
    }
  }

  async createSignedDownloadUrl(): Promise<string | null> {
    return null;
  }
}
