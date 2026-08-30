import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { DashboardHttpException } from './dashboard-http.exception';

@Catch(DashboardHttpException)
export class DashboardExceptionFilter implements ExceptionFilter {
  catch(exception: DashboardHttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const body = exception.getResponse();
    void response.status(exception.getStatus()).send(body);
  }
}
