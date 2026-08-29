import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { ServiceRequestsController } from './controllers/service-requests.controller';
import {
  NotReadyServiceRequestConversionPort,
  SERVICE_REQUEST_CONVERSION_PORT,
} from './domain/service-request-conversion.port';
import { ServiceRequestsRepository } from './repositories/service-requests.repository';
import { ServiceRequestsAccessService } from './services/service-requests-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [ServiceRequestsController],
  providers: [
    ServiceRequestsRepository,
    ServiceRequestsAccessService,
    {
      provide: SERVICE_REQUEST_CONVERSION_PORT,
      useClass: NotReadyServiceRequestConversionPort,
    },
  ],
  exports: [ServiceRequestsRepository, ServiceRequestsAccessService],
})
export class RequestsModule {}
