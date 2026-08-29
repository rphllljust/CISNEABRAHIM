import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';
import { TokenService, type AccessTokenClaims } from '../services/token.service';

export type AuthenticatedRequest = FastifyRequest & {
  auth?: AccessTokenClaims;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
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

    try {
      request.auth = this.tokenService.verifyAccessToken(token);
      return true;
    } catch {
      throw new AuthHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTH_ERROR_CODES.UNAUTHORIZED,
        'Invalid access token.',
      );
    }
  }
}
