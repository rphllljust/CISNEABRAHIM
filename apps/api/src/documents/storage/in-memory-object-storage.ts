import type {
  ObjectStorageGetResult,
  ObjectStoragePort,
  StoredObjectPayload,
} from './object-storage.port';

type StoredEntry = {
  buffer: Buffer;
  mimeType: string;
};

export class InMemoryObjectStorage implements ObjectStoragePort {
  readonly objects = new Map<string, StoredEntry>();
  failNextPut = false;
  failNextDelete = false;

  async putObject(payload: StoredObjectPayload): Promise<void> {
    if (this.failNextPut) {
      this.failNextPut = false;
      throw new Error('STORAGE_PUT_FAILED');
    }
    this.objects.set(payload.storageKey, {
      buffer: Buffer.from(payload.buffer),
      mimeType: payload.mimeType,
    });
  }

  async getObject(storageKey: string): Promise<ObjectStorageGetResult | null> {
    const entry = this.objects.get(storageKey);
    if (!entry) {
      return null;
    }
    return { buffer: Buffer.from(entry.buffer), mimeType: entry.mimeType };
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (this.failNextDelete) {
      this.failNextDelete = false;
      throw new Error('STORAGE_DELETE_FAILED');
    }
    this.objects.delete(storageKey);
  }

  async createSignedDownloadUrl(): Promise<string | null> {
    return null;
  }
}
