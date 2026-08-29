import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AllowedMimeType } from '../domain/document-categories';
import { DownloadTokenService } from '../storage/download-token.service';
import type { ObjectStoragePort } from '../storage/object-storage.port';
import { ObjectStorageService } from '../storage/object-storage.service';
import type { DocumentsRepository, PersistVersionInput } from '../repositories/documents.repository';

export type UploadBinaryInput = {
  buffer: Buffer;
  mimeType: AllowedMimeType;
  originalFilename: string;
  sha256: string;
  actorIdentityId: string;
  persist: (storedObjectId: string, storageKey: string) => Promise<void>;
};

@Injectable()
export class DocumentUploadCoordinator {
  constructor(
    private readonly objectStorage: ObjectStorageService,
    private readonly downloadTokens: DownloadTokenService,
  ) {}

  async persistWithCompensation(input: UploadBinaryInput): Promise<void> {
    const storageKey = this.downloadTokens.generateStorageKey();
    let uploaded = false;

    try {
      await this.objectStorage.putObject({
        storageKey,
        buffer: input.buffer,
        mimeType: input.mimeType,
      });
      uploaded = true;

      const storedObjectId = randomUUID();
      await input.persist(storedObjectId, storageKey);
    } catch (error) {
      if (uploaded) {
        await this.objectStorage.deleteObject(storageKey);
      }
      throw error;
    }
  }
}

export function createPersistWithCompensation(
  objectStorage: ObjectStoragePort,
  downloadTokens: DownloadTokenService,
  repository: DocumentsRepository,
  input: Omit<PersistVersionInput, 'storedObjectId' | 'storageKey'>,
): Promise<{ documentId: string; versionNumber: number }> {
  const storageKey = downloadTokens.generateStorageKey();
  let uploaded = false;

  return (async () => {
    try {
      await objectStorage.putObject({
        storageKey,
        buffer: input.buffer,
        mimeType: input.mimeType,
      });
      uploaded = true;

      return await repository.persistVersion({
        ...input,
        storageKey,
        storedObjectId: randomUUID(),
      });
    } catch (error) {
      if (uploaded) {
        await objectStorage.deleteObject(storageKey);
      }
      throw error;
    }
  })();
}
