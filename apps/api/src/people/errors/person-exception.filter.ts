import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { PersonHttpException } from './person-http.exception';

@Catch(PersonHttpException)
export class PersonExceptionFilter implements ExceptionFilter {
  catch(exception: PersonHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    response.status(exception.getStatus()).send(exception.getResponse());
  }
}

export function mapPersonValidationCodeToStatus(_code: string): HttpStatus {
  return HttpStatus.BAD_REQUEST;
}
