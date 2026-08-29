import { resolve } from 'node:path';

export type DocumentStorageConfig = {
  provider: 'filesystem' | 's3';
  rootPath: string;
  bucket: string;
  signedUrlTtlSeconds: number;
  downloadTokenSecret: string;
  s3Endpoint?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3ForcePathStyle: boolean;
};

export function loadDocumentStorageConfig(): DocumentStorageConfig {
  const provider = process.env['OBJECT_STORAGE_PROVIDER'] === 's3' ? 's3' : 'filesystem';
  const jwtSecret = process.env['JWT_SECRET'];
  const downloadTokenSecret =
    process.env['DOCUMENT_DOWNLOAD_TOKEN_SECRET'] ?? jwtSecret ?? 'test-download-token-secret';

  return {
    provider,
    rootPath: resolve(process.env['OBJECT_STORAGE_ROOT'] ?? resolve(process.cwd(), '.object-storage')),
    bucket: process.env['OBJECT_STORAGE_BUCKET'] ?? 'cisne-documents',
    signedUrlTtlSeconds: Number(process.env['OBJECT_STORAGE_SIGNED_URL_TTL_SECONDS'] ?? 600),
    downloadTokenSecret,
    s3Endpoint: process.env['OBJECT_STORAGE_S3_ENDPOINT'],
    s3Region: process.env['OBJECT_STORAGE_S3_REGION'] ?? 'us-east-1',
    s3AccessKeyId: process.env['OBJECT_STORAGE_S3_ACCESS_KEY_ID'],
    s3SecretAccessKey: process.env['OBJECT_STORAGE_S3_SECRET_ACCESS_KEY'],
    s3ForcePathStyle: process.env['OBJECT_STORAGE_S3_FORCE_PATH_STYLE'] === 'true',
  };
}
