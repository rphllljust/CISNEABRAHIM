import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';
import { S3ObjectStorage, type S3LikeClient } from './s3-object-storage';

function missingObjectError(name: string): Error {
  const error = new Error('object missing');
  error.name = name;
  return error;
}

describe('S3ObjectStorage', () => {
  it('stores objects with content type and bucket', async () => {
    const sent: unknown[] = [];
    const client: S3LikeClient = {
      send: async (command) => {
        sent.push(command);
        return {};
      },
    };
    const storage = new S3ObjectStorage(client, 'cisne-documents');

    await storage.putObject({
      storageKey: 'objects/a.pdf',
      buffer: Buffer.from('pdf'),
      mimeType: 'application/pdf',
    });

    const command = sent[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    const put = command as PutObjectCommand;
    expect(put.input.Bucket).toBe('cisne-documents');
    expect(put.input.Key).toBe('objects/a.pdf');
    expect(put.input.ContentType).toBe('application/pdf');
  });

  it('loads objects and converts sdk body into buffer', async () => {
    const payload = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const client: S3LikeClient = {
      send: async (command) => {
        expect(command).toBeInstanceOf(GetObjectCommand);
        return {
          ContentType: 'application/pdf',
          Body: {
            transformToByteArray: async () => payload,
          },
        };
      },
    };
    const storage = new S3ObjectStorage(client, 'cisne-documents');

    const loaded = await storage.getObject('objects/a.pdf');

    expect(loaded?.mimeType).toBe('application/pdf');
    expect(loaded?.buffer.equals(Buffer.from(payload))).toBe(true);
  });

  it('returns null when object key is missing', async () => {
    const client: S3LikeClient = {
      send: async () => {
        throw missingObjectError('NoSuchKey');
      },
    };
    const storage = new S3ObjectStorage(client, 'cisne-documents');

    await expect(storage.getObject('objects/missing.pdf')).resolves.toBeNull();
  });

  it('ignores delete for missing objects', async () => {
    const client: S3LikeClient = {
      send: async (command) => {
        expect(command).toBeInstanceOf(DeleteObjectCommand);
        throw missingObjectError('NotFound');
      },
    };
    const storage = new S3ObjectStorage(client, 'cisne-documents');

    await expect(storage.deleteObject('objects/missing.pdf')).resolves.toBeUndefined();
  });

  it('creates signed download URLs with clamped ttl', async () => {
    const signer = vi.fn(async (_client: S3LikeClient, command: GetObjectCommand, ttl: number) => {
      expect(command.input.Bucket).toBe('cisne-documents');
      expect(command.input.Key).toBe('objects/a.pdf');
      expect(ttl).toBe(1);
      return 'https://signed.example/download';
    });
    const storage = new S3ObjectStorage(
      {
        send: async () => ({}),
      },
      'cisne-documents',
      signer,
    );

    const url = await storage.createSignedDownloadUrl('objects/a.pdf', 0);

    expect(url).toBe('https://signed.example/download');
    expect(signer).toHaveBeenCalledTimes(1);
  });
});
