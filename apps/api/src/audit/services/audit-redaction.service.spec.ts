import { describe, expect, it } from 'vitest';
import {
  coerceOptionalUuid,
  containsForbiddenSecret,
  redactAuditMetadata,
  sanitizeAuditText,
} from './audit-redaction.service';

describe('audit-redaction.service', () => {
  it('strips forbidden metadata keys and control characters', () => {
    const redacted = redactAuditMetadata({
      password: 'secret-value',
      refreshToken: 'opaque',
      note: 'line1\nline2',
      attempt: 1,
    });

    expect(redacted).toEqual({ note: 'line1 line2', attempt: 1 });
    expect(JSON.stringify(redacted).toLowerCase()).not.toContain('secret-value');
    expect(JSON.stringify(redacted).toLowerCase()).not.toContain('opaque');
  });

  it('sanitizes audit text against injection characters', () => {
    expect(sanitizeAuditText('  hello\r\nworld  ')).toBe('hello world');
  });

  it('drops non-uuid actor identifiers before persistence', () => {
    expect(coerceOptionalUuid('sid-admin')).toBeNull();
    expect(coerceOptionalUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('detects forbidden secret patterns in serialized audit rows', () => {
    expect(containsForbiddenSecret('Bearer abc.def.ghi')).toBe(true);
    expect(containsForbiddenSecret('security:auth:login')).toBe(false);
  });
});
