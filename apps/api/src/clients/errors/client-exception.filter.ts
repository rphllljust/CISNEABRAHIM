import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ClientHttpException } from './client-http.exception';

@Catch(ClientHttpException)
export class ClientExceptionFilter implements ExceptionFilter {
  catch(exception: ClientHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const body = exception.getResponse();
    response.status(exception.getStatus()).send(body);
  }
}

export function mapValidationCodeToStatus(code: string): HttpStatus {
  switch (code) {
    case 'TAX_ID_INVALID':
    case 'LEGAL_NAME_REQUIRED':
    case 'CONTACT_REQUIRED':
    case 'CONTACT_NOT_USABLE':
    case 'VERSION_INVALID':
    case 'DEACTIVATION_REASON_REQUIRED':
      return HttpStatus.BAD_REQUEST;
    default:
      return HttpStatus.BAD_REQUEST;
  }
}
