import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { CorrelationIdInterceptor } from './correlation-id.interceptor';
import { SecurityHeadersInterceptor } from './security-headers.interceptor';

/**
 * Shared Nest bootstrap for API E2E/integration inject tests.
 * Exception handling comes from SecurityModule APP_FILTER providers (ApiExceptionFilter).
 */
export function configureApiTestApp(app: NestFastifyApplication): void {
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new CorrelationIdInterceptor(), new SecurityHeadersInterceptor());
}