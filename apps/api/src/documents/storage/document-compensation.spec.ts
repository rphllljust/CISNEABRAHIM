import { describe, expect, it } from 'vitest';
import { InMemoryObjectStorage } from './in-memory-object-storage';
import { DownloadTokenService } from './download-token.service';
import { createPersistWithCompensation } from '../services/document-upload-coordinator';
import { DOCUMENT_CATEGORIES } from '../domain/document-categories';
import { minimalPdfBuffer } from '../domain/file-validation';

describe('document upload compensation', () => {
  it('deletes staged object when storage put fails', async () => {
    const storage = new InMemoryObjectStorage();
    storage.failNextPut = true;
    const downloadTokens = new DownloadTokenService();
    const repo = { persistVersion: async () => ({ documentId: 'x', versionNumber: 1 }) };

    await expect(
      createPersistWithCompensation(storage, downloadTokens, repo as never, {
        title: 'Fail storage',
        categoryCode: DOCUMENT_CATEGORIES.General,
        classificationCode: 'INTERNAL',
        unitId: 'unit-a',
        actorIdentityId: '11111111-1111-4111-8111-111111111111',
        sha256: 'abc',
        mimeType: 'application/pdf',
        originalFilename: 'fail.pdf',
        buffer: minimalPdfBuffer(),
      }),
    ).rejects.toThrow('STORAGE_PUT_FAILED');
    expect(storage.objects.size).toBe(0);
  });
});
