import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const MIN_PASSWORD_LENGTH = 12;

const WEAK_PASSWORD_PATTERNS = [
  /^password$/i,
  /^12345678/,
  /^qwerty/i,
  /^admin$/i,
  /^changeme$/i,
] as const;

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
    return {
      valid: false,
      reason: 'Password must include uppercase, lowercase, digit, and symbol characters.',
    };
  }

  for (const pattern of WEAK_PASSWORD_PATTERNS) {
    if (pattern.test(password)) {
      return { valid: false, reason: 'Password matches a known weak pattern.' };
    }
  }

  return { valid: true };
}

export function generateSecurePassword(byteLength = 24): string {
  return randomBytes(byteLength).toString('base64url');
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(plain, salt, 64)) as Buffer;
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPasswordHash(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const saltHex = parts[1];
  const hashHex = parts[2];
  if (!saltHex || !hashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = (await scryptAsync(plain, salt, expected.length)) as Buffer;

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}
