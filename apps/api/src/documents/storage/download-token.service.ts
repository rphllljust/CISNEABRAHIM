import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { loadDocumentStorageConfig } from '../config/document-storage.config';

export type DownloadTokenPayload = {
  documentId: string;
  versionNumber: number;
  expiresAt: number;
};

@Injectable()
export class DownloadTokenService {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor() {
    const config = loadDocumentStorageConfig();
    this.secret = config.downloadTokenSecret;
    this.ttlSeconds = config.signedUrlTtlSeconds;
  }

  getTtlSeconds(): number {
    return this.ttlSeconds;
  }

  issue(documentId: string, versionNumber: number): { token: string; expiresAt: string } {
    const expiresAtMs = Date.now() + this.ttlSeconds * 1000;
    const payload = `${documentId}:${versionNumber}:${expiresAtMs}`;
    const signature = createHmac('sha256', this.secret).update(payload).digest('base64url');
    const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
    return { token, expiresAt: new Date(expiresAtMs).toISOString() };
  }

  verify(token: string): DownloadTokenPayload | 'INVALID' | 'EXPIRED' {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const lastColon = decoded.lastIndexOf(':');
      if (lastColon <= 0) {
        return 'INVALID';
      }
      const payload = decoded.slice(0, lastColon);
      const signature = decoded.slice(lastColon + 1);
      const expected = createHmac('sha256', this.secret).update(payload).digest('base64url');
      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expected);
      if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
        return 'INVALID';
      }

      const [documentId, versionRaw, expiresRaw] = payload.split(':');
      if (!documentId || !versionRaw || !expiresRaw) {
        return 'INVALID';
      }
      const expiresAt = Number(expiresRaw);
      const versionNumber = Number(versionRaw);
      if (!Number.isFinite(expiresAt) || !Number.isInteger(versionNumber) || versionNumber < 1) {
        return 'INVALID';
      }
      if (Date.now() > expiresAt) {
        return 'EXPIRED';
      }
      return { documentId, versionNumber, expiresAt };
    } catch {
      return 'INVALID';
    }
  }

  generateStorageKey(): string {
    return `objects/${randomBytes(16).toString('hex')}`;
  }
}
