import { Injectable } from '@nestjs/common';
import { FilesystemObjectStorage } from './filesystem-object-storage';
import { loadDocumentStorageConfig } from '../config/document-storage.config';
import type { ObjectStoragePort } from './object-storage.port';
import { OBJECT_STORAGE_PORT } from './object-storage.port';

@Injectable()
export class ObjectStorageService implements ObjectStoragePort {
  private readonly delegate: ObjectStoragePort;

  constructor() {
    const config = loadDocumentStorageConfig();
    if (config.provider === 's3') {
      throw new Error('S3 object storage provider is not configured in this build.');
    }
    this.delegate = new FilesystemObjectStorage(config.rootPath);
  }

  putObject(...args: Parameters<ObjectStoragePort['putObject']>) {
    return this.delegate.putObject(...args);
  }

  getObject(...args: Parameters<ObjectStoragePort['getObject']>) {
    return this.delegate.getObject(...args);
  }

  deleteObject(...args: Parameters<ObjectStoragePort['deleteObject']>) {
    return this.delegate.deleteObject(...args);
  }

  createSignedDownloadUrl(...args: Parameters<ObjectStoragePort['createSignedDownloadUrl']>) {
    return this.delegate.createSignedDownloadUrl(...args);
  }
}

export { OBJECT_STORAGE_PORT };
