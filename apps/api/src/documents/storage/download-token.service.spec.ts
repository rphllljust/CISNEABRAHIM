import { describe, expect, it } from 'vitest';
import { DownloadTokenService } from './download-token.service';

describe('DownloadTokenService', () => {
  it('issues and verifies a download token', () => {
    const service = new DownloadTokenService();
    const issued = service.issue('11111111-1111-4111-8111-111111111111', 2);
    const verified = service.verify(issued.token);
    expect(verified).toEqual({
      documentId: '11111111-1111-4111-8111-111111111111',
      versionNumber: 2,
      expiresAt: expect.any(Number) as number,
    });
  });

  it('rejects tampered tokens', () => {
    const service = new DownloadTokenService();
    const issued = service.issue('11111111-1111-4111-8111-111111111111', 1);
    const decoded = Buffer.from(issued.token, 'base64url').toString('utf8');
    const tampered = Buffer.from(`${decoded.slice(0, -1)}Z`).toString('base64url');
    expect(service.verify(tampered)).toBe('INVALID');
  });
});
