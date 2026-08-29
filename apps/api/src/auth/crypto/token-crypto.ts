import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function generateOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function normalizeLoginIdentifier(login: string): string {
  return login.trim().toLowerCase();
}
