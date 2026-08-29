import { Inject, Injectable } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { AUTH_CONFIG } from '../auth.constants';
import type { AuthConfig } from '../config/auth.config';

export type AccessTokenClaims = {
  sub: string;
  sid: string;
  jti: string;
};

type JwtHeader = {
  alg: 'HS256';
  typ: 'JWT';
};

type JwtPayload = AccessTokenClaims & {
  iss: string;
  aud: string;
  iat: number;
  exp: number;
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

@Injectable()
export class TokenService {
  constructor(@Inject(AUTH_CONFIG) private readonly config: AuthConfig) {}

  issueAccessToken(identityId: string, sessionId: string): { token: string; expiresIn: number } {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.accessTokenTtlSeconds;
    const payload: JwtPayload = {
      sub: identityId,
      sid: sessionId,
      jti: randomUUID(),
      iss: this.config.jwtIssuer,
      aud: this.config.jwtAudience,
      iat: now,
      exp: now + expiresIn,
    };

    const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
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
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error('invalid token format');
    }

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const valid = verifyHs256(signingInput, signature, this.config.jwtSecret);

    if (!valid) {
      throw new Error('invalid signature');
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.iss !== this.config.jwtIssuer || payload.aud !== this.config.jwtAudience) {
      throw new Error('invalid claims');
    }

    if (payload.exp <= now) {
      throw new Error('token expired');
    }

    return {
      sub: payload.sub,
      sid: payload.sid,
      jti: payload.jti,
    };
  }
}
