import { randomBytes } from 'node:crypto';
import { decryptBuffer, encryptBuffer, sha256Hex } from './backup-crypto';

describe('backup-crypto', () => {
  const key = randomBytes(32).toString('base64');

  it('computes stable sha256 checksum', () => {
    const buffer = Buffer.from('cisne-backup-checksum');
    expect(sha256Hex(buffer)).toHaveLength(64);
    expect(sha256Hex(buffer)).toBe(sha256Hex(buffer));
  });

  it('encrypts and decrypts round-trip without storing key in payload', () => {
    const plain = Buffer.from('PGDMP-backup-payload');
    const encrypted = encryptBuffer(plain, key);
    expect(encrypted.includes(Buffer.from(key))).toBe(false);
    const decrypted = decryptBuffer(encrypted, key);
    expect(decrypted.equals(plain)).toBe(true);
  });
});
