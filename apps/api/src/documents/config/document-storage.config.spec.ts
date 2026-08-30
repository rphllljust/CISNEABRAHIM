import { afterEach, describe, expect, it } from 'vitest';
import { join, resolve } from 'node:path';
import { loadDocumentStorageConfig } from './document-storage.config';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('document storage config', () => {
  it('resolves relative object storage roots under CISNE_RUNTIME_DIR', () => {
    const runtimeDir = resolve(process.cwd(), '.runtime-test');
    process.env['CISNE_RUNTIME_DIR'] = runtimeDir;
    process.env['OBJECT_STORAGE_ROOT'] = '.object-storage-test';

    const config = loadDocumentStorageConfig();

    expect(config.rootPath).toBe(join(runtimeDir, '.object-storage-test'));
  });

  it('supports production S3 aliases used by infra env files', () => {
    process.env['OBJECT_STORAGE_PROVIDER'] = 's3';
    process.env['OBJECT_STORAGE_BUCKET'] = 'cisne-prod-documents';
    process.env['OBJECT_STORAGE_ENDPOINT'] = 'http://minio:9000';
    process.env['OBJECT_STORAGE_REGION'] = 'us-east-1';
    process.env['S3_ACCESS_KEY_ID'] = 'key';
    process.env['S3_SECRET_ACCESS_KEY'] = 'secret';

    const config = loadDocumentStorageConfig();

    expect(config.provider).toBe('s3');
    expect(config.s3Endpoint).toBe('http://minio:9000');
    expect(config.s3Region).toBe('us-east-1');
    expect(config.s3AccessKeyId).toBe('key');
    expect(config.s3SecretAccessKey).toBe('secret');
    expect(config.s3ForcePathStyle).toBe(true);
  });

  it('respects canonical S3 variables and explicit force path style override', () => {
    process.env['OBJECT_STORAGE_PROVIDER'] = 's3';
    process.env['OBJECT_STORAGE_BUCKET'] = 'cisne-prod-documents';
    process.env['OBJECT_STORAGE_S3_ENDPOINT'] = 'https://s3.sa-east-1.amazonaws.com';
    process.env['OBJECT_STORAGE_S3_REGION'] = 'sa-east-1';
    process.env['OBJECT_STORAGE_S3_ACCESS_KEY_ID'] = 'key2';
    process.env['OBJECT_STORAGE_S3_SECRET_ACCESS_KEY'] = 'secret2';
    process.env['OBJECT_STORAGE_S3_FORCE_PATH_STYLE'] = 'false';

    const config = loadDocumentStorageConfig();

    expect(config.s3Endpoint).toBe('https://s3.sa-east-1.amazonaws.com');
    expect(config.s3Region).toBe('sa-east-1');
    expect(config.s3AccessKeyId).toBe('key2');
    expect(config.s3SecretAccessKey).toBe('secret2');
    expect(config.s3ForcePathStyle).toBe(false);
  });
});
