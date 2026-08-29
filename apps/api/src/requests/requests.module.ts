import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { ServiceRequestsController } from './controllers/service-requests.controller';
import { ServiceRequestsRepository } from './repositories/service-requests.repository';
import { ServiceRequestsAccessService } from './services/service-requests-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule, ServiceOrdersModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsRepository, ServiceRequestsAccessService],
  exports: [ServiceRequestsRepository, ServiceRequestsAccessService],
})
export class RequestsModule {}
