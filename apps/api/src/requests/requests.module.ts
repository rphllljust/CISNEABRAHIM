import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { OutboxModule } from '../platform/outbox/outbox.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { ServiceRequestsController } from './controllers/service-requests.controller';
import { ServiceRequestsRepository } from './repositories/service-requests.repository';
import { ServiceRequestsAccessAuthz } from './services/service-requests-access.authz';
import { ServiceRequestsAccessService } from './services/service-requests-access.service';
import { ServiceRequestsReferenceValidationService } from './services/service-requests-reference-validation.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule, OutboxModule, ServiceOrdersModule],
  controllers: [ServiceRequestsController],
  providers: [
    ServiceRequestsRepository,
    ServiceRequestsAccessAuthz,
    ServiceRequestsReferenceValidationService,
    ServiceRequestsAccessService,
  ],
  exports: [ServiceRequestsRepository, ServiceRequestsAccessService],
})
export class RequestsModule {}
