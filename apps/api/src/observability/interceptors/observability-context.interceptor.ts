import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Observable, type Subscription } from 'rxjs';
import { CORRELATION_ID_HEADER, resolveCorrelationId } from '../../infrastructure/http/correlation-id';
import {
  createRequestId,
  runWithObservabilityContext,
  type ObservabilityContextState,
} from '../context/observability-context';
import { StructuredLoggerService } from '../logging/structured-logger.service';
import { MetricsRegistryService } from '../metrics/metrics-registry.service';

@Injectable()
export class ObservabilityContextInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: StructuredLoggerService,
    private readonly metrics: MetricsRegistryService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const correlationId = resolveCorrelationId(request);
    const requestId = createRequestId();
    const startedAt = Date.now();
    const operation = `${request.method} ${request.routeOptions?.url ?? request.url}`;
    const contextState: ObservabilityContextState = { requestId, correlationId, operation };

    return new Observable((observer) => {
      let failed = false;
      let errorCode: string | undefined;
      let subscription: Subscription | undefined;

      runWithObservabilityContext(contextState, () => {
        subscription = next.handle().subscribe({
          next: (value) => observer.next(value),
          error: (error: unknown) => {
            failed = true;
            if (typeof error === 'object' && error !== null && 'code' in error) {
              const code = (error as { code?: unknown }).code;
              errorCode = typeof code === 'string' ? code : undefined;
            }
            observer.error(error);
          },
          complete: () => observer.complete(),
        });
      });

      return () => {
        subscription?.unsubscribe();
        const durationMs = Date.now() - startedAt;
        const statusCode = response.statusCode ?? (failed ? 500 : 200);
        const isError = failed || statusCode >= 500;
        this.metrics.recordHttpRequest(durationMs, isError);
        void response.header(CORRELATION_ID_HEADER, correlationId);
        void response.header('x-request-id', requestId);
        this.logger.operation({
          level: isError ? 'error' : 'info',
          message: 'http_request_completed',
          operation,
          durationMs,
          result: isError ? 'failure' : 'success',
          errorCode,
          metadata: {
            statusCode,
            method: request.method,
            path: request.routeOptions?.url ?? request.url,
          },
        });
      };
    });
  }
}
