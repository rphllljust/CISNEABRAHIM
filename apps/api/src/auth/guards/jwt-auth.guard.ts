import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';
import { SessionValidationService } from '../services/session-validation.service';
import { TokenService, type AccessTokenClaims } from '../services/token.service';

export type AuthenticatedRequest = FastifyRequest & {
  auth?: AccessTokenClaims;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionValidation: SessionValidationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.UNAUTHORIZED,
        'Missing bearer token.',
      );
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.UNAUTHORIZED,
        'Missing bearer token.',
      );
    }

    let claims: AccessTokenClaims;
    try {
      claims = this.tokenService.verifyAccessToken(token);
    } catch {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.UNAUTHORIZED,
        'Invalid access token.',
      );
    }

    await this.sessionValidation.assertActiveSession(claims.sub, claims.sid);
    request.auth = claims;
    return true;
  }
}
