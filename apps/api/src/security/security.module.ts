import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SecurityClientErrorFilter, SecurityExceptionFilter } from './filters/security-exception.filter';
import { EndpointRateLimitService } from './services/endpoint-rate-limit.service';

@Global()
@Module({
  providers: [
    EndpointRateLimitService,
    SecurityClientErrorFilter,
    SecurityExceptionFilter,
    {
      provide: APP_FILTER,
      useExisting: SecurityExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useExisting: SecurityClientErrorFilter,
    },
  ],
  exports: [EndpointRateLimitService, SecurityClientErrorFilter, SecurityExceptionFilter],
})
export class SecurityModule {}
