import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AccessTokenClaims } from '../services/token.service';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenClaims => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.auth) {
      throw new Error('Auth context missing — JwtAuthGuard required.');
    }
    return request.auth;
  },
);
