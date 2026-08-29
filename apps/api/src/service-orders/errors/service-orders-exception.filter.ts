import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ServiceOrdersHttpException } from './service-orders-http.exception';

@Catch(ServiceOrdersHttpException)
export class ServiceOrdersExceptionFilter implements ExceptionFilter {
  catch(exception: ServiceOrdersHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const body = exception.getResponse();
    response.status(exception.getStatus()).send(body);
  }
}
