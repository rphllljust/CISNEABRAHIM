import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { MeasurementsHttpException } from './measurements-http.exception';

@Catch(MeasurementsHttpException)
export class MeasurementsExceptionFilter implements ExceptionFilter {
  catch(exception: MeasurementsHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    void response.status(status).send(body);
  }
}
