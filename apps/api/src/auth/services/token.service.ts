import { Inject, Injectable } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { AUTH_CONFIG } from '../auth.constants';
import type { AuthConfig } from '../config/auth.config';
import { AUTH_LIMITS } from '../dto/body-validator';

export type AccessTokenClaims = {
  sub: string;
  sid: string;
  jti: string;
};

type JwtHeader = {
  alg: string;
  typ?: string;
};

type JwtPayload = {
  sub?: unknown;
  sid?: unknown;
  jti?: unknown;
  iss?: unknown;
  aud?: unknown;
  iat?: unknown;
  exp?: unknown;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signHs256(signingInput: string, secret: string): string {
  return createHmac('sha256', secret).update(signingInput).digest('base64url');
}

function verifyHs256(signingInput: string, signature: string, secret: string): boolean {
  const expected = signHs256(signingInput, secret);
  const left = Buffer.from(signature, 'base64url');
  const right = Buffer.from(expected, 'base64url');
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function requireStringClaim(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`missing claim ${name}`);
  }
  return value;
}

@Injectable()
export class TokenService {
  constructor(@Inject(AUTH_CONFIG) private readonly config: AuthConfig) {}

  issueAccessToken(identityId: string, sessionId: string): { token: string; expiresIn: number } {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.accessTokenTtlSeconds;
    const payload = {
      sub: identityId,
      sid: sessionId,
      jti: randomUUID(),
      iss: this.config.jwtIssuer,
      aud: this.config.jwtAudience,
      iat: now,
      exp: now + expiresIn,
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = signHs256(signingInput, this.config.jwtSecret);

    return {
      token: `${signingInput}.${signature}`,
      expiresIn,
    };
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    if (token.length > AUTH_LIMITS.maxJwtLength) {
      throw new Error('token too large');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error('invalid token format');
    }

    let header: JwtHeader;
    try {
      header = JSON.parse(base64UrlDecode(encodedHeader)) as JwtHeader;
    } catch {
      throw new Error('invalid token header');
    }

    if (header.alg !== 'HS256') {
      throw new Error('invalid algorithm');
    }

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const valid = verifyHs256(signingInput, signature, this.config.jwtSecret);

    if (!valid) {
      throw new Error('invalid signature');
    }

    let payload: JwtPayload;
    try {
      payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
    } catch {
      throw new Error('invalid token payload');
    }

    const now = Math.floor(Date.now() / 1000);
    const skew = this.config.jwtClockSkewSeconds;

    const iss = payload.iss;
    const aud = payload.aud;
    if (iss !== this.config.jwtIssuer || aud !== this.config.jwtAudience) {
      throw new Error('invalid claims');
    }

    const iat = payload.iat;
    const exp = payload.exp;
    if (typeof iat !== 'number' || typeof exp !== 'number') {
      throw new Error('invalid time claims');
    }

    if (iat > now + skew) {
      throw new Error('token not yet valid');
    }

    if (exp <= now - skew) {
      throw new Error('token expired');
    }

    return {
      sub: requireStringClaim(payload.sub, 'sub'),
      sid: requireStringClaim(payload.sid, 'sid'),
      jti: requireStringClaim(payload.jti, 'jti'),
    };
  }
}
