import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Observable, tap } from 'rxjs';
import { loadSecurityConfig } from '../../security/config/security.config';

const BASE_SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'cache-control': 'no-store',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
};

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  private readonly config = loadSecurityConfig();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<FastifyReply>();
        for (const [header, value] of Object.entries(BASE_SECURITY_HEADERS)) {
          void response.header(header, value);
        }
        void response.header('content-security-policy', this.config.contentSecurityPolicy);
        if (this.config.hstsEnabled) {
          void response.header(
            'strict-transport-security',
            `max-age=${this.config.hstsMaxAgeSeconds}; includeSubDomains`,
          );
        }
      }),
    );
  }
}
