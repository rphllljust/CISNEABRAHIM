export type StoredObjectPayload = {
  storageKey: string;
  buffer: Buffer;
  mimeType: string;
};

export type ObjectStorageGetResult = {
  buffer: Buffer;
  mimeType: string;
};

export interface ObjectStoragePort {
  putObject(payload: StoredObjectPayload): Promise<void>;
  getObject(storageKey: string): Promise<ObjectStorageGetResult | null>;
  deleteObject(storageKey: string): Promise<void>;
  createSignedDownloadUrl(storageKey: string, ttlSeconds: number): Promise<string | null>;
}

export const OBJECT_STORAGE_PORT = Symbol('OBJECT_STORAGE_PORT');
