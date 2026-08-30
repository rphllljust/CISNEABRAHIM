import { describe, expect, it } from 'vitest';
import { isPathTraversalAttempt, sanitizeUploadFilename } from './safe-filename';

describe('safe-filename', () => {
  it('strips path traversal segments', () => {
    expect(sanitizeUploadFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeUploadFilename('..\\..\\secret.pdf')).toBe('secret.pdf');
  });

  it('detects traversal attempts', () => {
    expect(isPathTraversalAttempt('../evil.pdf')).toBe(true);
    expect(isPathTraversalAttempt('report.pdf')).toBe(false);
  });

  it('falls back for empty names', () => {
    expect(sanitizeUploadFilename('   ')).toBe('upload.bin');
    expect(sanitizeUploadFilename('..')).toBe('upload.bin');
  });

  it('truncates very long filenames', () => {
    const longName = `${'a'.repeat(300)}.pdf`;
    expect(sanitizeUploadFilename(longName).length).toBeLessThanOrEqual(200);
  });
});
