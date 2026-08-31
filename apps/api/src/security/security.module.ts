import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ApiExceptionFilter } from '../infrastructure/http/api-exception.filter';
import { SecurityClientErrorFilter, SecurityExceptionFilter } from './filters/security-exception.filter';
import { EndpointRateLimitService } from './services/endpoint-rate-limit.service';

@Global()
@Module({
  providers: [
    EndpointRateLimitService,
    SecurityClientErrorFilter,
    ApiExceptionFilter,
    SecurityExceptionFilter,
    {
      provide: APP_FILTER,
      useExisting: SecurityExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useExisting: ApiExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useExisting: SecurityClientErrorFilter,
    },
  ],
  exports: [
    EndpointRateLimitService,
    SecurityClientErrorFilter,
    ApiExceptionFilter,
    SecurityExceptionFilter,
  ],
})
export class SecurityModule {}
