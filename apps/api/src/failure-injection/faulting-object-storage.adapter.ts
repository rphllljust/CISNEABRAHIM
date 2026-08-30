import type { ObjectStoragePort } from '../documents/storage/object-storage.port';

export class FaultingObjectStorageAdapter implements ObjectStoragePort {
  private failPut = false;
  private timeoutPut = false;
  private hashMismatch = false;

  constructor(private readonly delegate: ObjectStoragePort) {}

  reset(): void {
    this.failPut = false;
    this.timeoutPut = false;
    this.hashMismatch = false;
  }

  setFailPut(value: boolean): void {
    this.failPut = value;
  }

  setTimeoutPut(value: boolean): void {
    this.timeoutPut = value;
  }

  setHashMismatch(value: boolean): void {
    this.hashMismatch = value;
  }

  async putObject(...args: Parameters<ObjectStoragePort['putObject']>) {
    if (this.timeoutPut) {
      await new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error('STORAGE_TIMEOUT')), 75);
      });
    }
    if (this.failPut) {
      throw new Error('STORAGE_FAIL');
    }
    await this.delegate.putObject(...args);
    if (this.hashMismatch) {
      throw new Error('STORAGE_HASH_MISMATCH');
    }
  }

  async getObject(...args: Parameters<ObjectStoragePort['getObject']>) {
    return this.delegate.getObject(...args);
  }

  async deleteObject(...args: Parameters<ObjectStoragePort['deleteObject']>) {
    return this.delegate.deleteObject(...args);
  }

  async createSignedDownloadUrl(...args: Parameters<ObjectStoragePort['createSignedDownloadUrl']>) {
    return this.delegate.createSignedDownloadUrl(...args);
  }
}
