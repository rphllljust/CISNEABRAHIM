import { Injectable, Optional } from '@nestjs/common';
import { MetricsRegistryService } from '../../observability/metrics/metrics-registry.service';
import { FilesystemObjectStorage } from './filesystem-object-storage';
import { loadDocumentStorageConfig } from '../config/document-storage.config';
import type { ObjectStoragePort } from './object-storage.port';
import { OBJECT_STORAGE_PORT } from './object-storage.port';

@Injectable()
export class ObjectStorageService implements ObjectStoragePort {
  private readonly delegate: ObjectStoragePort;

  constructor(@Optional() private readonly metrics?: MetricsRegistryService) {
    const config = loadDocumentStorageConfig();
    if (config.provider === 's3') {
      throw new Error('S3 object storage provider is not configured in this build.');
    }
    this.delegate = new FilesystemObjectStorage(config.rootPath);
  }

  async putObject(...args: Parameters<ObjectStoragePort['putObject']>) {
    return this.wrap('putObject', () => this.delegate.putObject(...args));
  }

  async getObject(...args: Parameters<ObjectStoragePort['getObject']>) {
    return this.wrap('getObject', () => this.delegate.getObject(...args));
  }

  async deleteObject(...args: Parameters<ObjectStoragePort['deleteObject']>) {
    return this.wrap('deleteObject', () => this.delegate.deleteObject(...args));
  }

  async createSignedDownloadUrl(...args: Parameters<ObjectStoragePort['createSignedDownloadUrl']>) {
    return this.wrap('createSignedDownloadUrl', () => this.delegate.createSignedDownloadUrl(...args));
  }

  private async wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.metrics?.recordStorageFailure();
      throw error instanceof Error ? error : new Error(`${operation}_FAILED`);
    }
  }
}

export { OBJECT_STORAGE_PORT };
