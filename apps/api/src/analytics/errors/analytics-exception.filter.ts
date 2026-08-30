import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AnalyticsHttpException } from './analytics-http.exception';

@Catch(AnalyticsHttpException)
export class AnalyticsExceptionFilter implements ExceptionFilter {
  catch(exception: AnalyticsHttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const body = exception.getResponse();
    void response.status(exception.getStatus()).send(body);
  }
}
