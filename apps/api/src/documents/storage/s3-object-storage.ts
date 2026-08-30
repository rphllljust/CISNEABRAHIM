import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { DocumentStorageConfig } from '../config/document-storage.config';
import type {
  ObjectStorageGetResult,
  ObjectStoragePort,
  StoredObjectPayload,
} from './object-storage.port';

const MAX_SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

export type S3LikeClient = {
  send(command: unknown): Promise<unknown>;
};

type PresignDownloadUrl = (
  client: S3LikeClient,
  command: GetObjectCommand,
  ttlSeconds: number,
) => Promise<string>;

type GetObjectResponse = {
  Body?: unknown;
  ContentType?: string;
};

function normalizeSignedUrlTtlSeconds(ttlSeconds: number): number {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds < 1) {
    return 1;
  }
  return Math.min(Math.floor(ttlSeconds), MAX_SIGNED_URL_TTL_SECONDS);
}

function hasTransformToByteArray(value: unknown): value is {
  transformToByteArray(): Promise<Uint8Array>;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { transformToByteArray?: unknown };
  return typeof candidate.transformToByteArray === 'function';
}

function hasArrayBuffer(value: unknown): value is {
  arrayBuffer(): Promise<ArrayBuffer>;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { arrayBuffer?: unknown };
  return typeof candidate.arrayBuffer === 'function';
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { [Symbol.asyncIterator]?: unknown };
  return typeof candidate[Symbol.asyncIterator] === 'function';
}

function chunkToBuffer(chunk: unknown): Buffer {
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }
  if (chunk instanceof Uint8Array) {
    return Buffer.from(chunk);
  }
  if (chunk instanceof ArrayBuffer) {
    return Buffer.from(chunk);
  }
  if (typeof chunk === 'string') {
    return Buffer.from(chunk, 'utf8');
  }
  throw new Error('Unsupported S3 response chunk type');
}

async function readBodyBuffer(body: unknown): Promise<Buffer> {
  if (hasTransformToByteArray(body)) {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }
  if (hasArrayBuffer(body)) {
    const arrayBuffer = await body.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  if (isAsyncIterable(body)) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(chunkToBuffer(chunk));
    }
    return Buffer.concat(chunks);
  }
  return chunkToBuffer(body);
}

function readHttpStatusCode(error: Error): number | null {
  const withMetadata = error as { $metadata?: unknown };
  if (!withMetadata.$metadata || typeof withMetadata.$metadata !== 'object') {
    return null;
  }
  const metadata = withMetadata.$metadata as { httpStatusCode?: unknown };
  return typeof metadata.httpStatusCode === 'number' ? metadata.httpStatusCode : null;
}

function isObjectMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
    return true;
  }
  return readHttpStatusCode(error) === 404;
}

function resolveS3ClientConfig(config: DocumentStorageConfig): S3ClientConfig {
  const clientConfig: S3ClientConfig = {
    region: config.s3Region ?? 'us-east-1',
    forcePathStyle: config.s3ForcePathStyle,
  };

  if (config.s3Endpoint) {
    clientConfig.endpoint = config.s3Endpoint;
  }

  if (config.s3AccessKeyId && config.s3SecretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3SecretAccessKey,
    };
  }

  return clientConfig;
}

const defaultPresignDownloadUrl: PresignDownloadUrl = async (
  client,
  command,
  ttlSeconds,
) => {
  return getSignedUrl(client as S3Client, command, { expiresIn: ttlSeconds });
};

export class S3ObjectStorage implements ObjectStoragePort {
  constructor(
    private readonly client: S3LikeClient,
    private readonly bucket: string,
    private readonly presignDownloadUrl: PresignDownloadUrl = defaultPresignDownloadUrl,
  ) {
    if (!bucket.trim()) {
      throw new Error('S3 object storage requires OBJECT_STORAGE_BUCKET');
    }
  }

  static fromConfig(config: DocumentStorageConfig): S3ObjectStorage {
    const client = new S3Client(resolveS3ClientConfig(config));
    return new S3ObjectStorage(client, config.bucket);
  }

  async putObject(payload: StoredObjectPayload): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: payload.storageKey,
        Body: payload.buffer,
        ContentType: payload.mimeType,
      }),
    );
  }

  async getObject(storageKey: string): Promise<ObjectStorageGetResult | null> {
    try {
      const response = (await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      )) as GetObjectResponse;
      const buffer = response.Body ? await readBodyBuffer(response.Body) : Buffer.alloc(0);
      return {
        buffer,
        mimeType: response.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      if (isObjectMissingError(error)) {
        return null;
      }
      throw error;
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );
    } catch (error) {
      if (isObjectMissingError(error)) {
        return;
      }
      throw error;
    }
  }

  async createSignedDownloadUrl(
    storageKey: string,
    ttlSeconds: number,
  ): Promise<string | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });
    return this.presignDownloadUrl(
      this.client,
      command,
      normalizeSignedUrlTtlSeconds(ttlSeconds),
    );
  }
}
