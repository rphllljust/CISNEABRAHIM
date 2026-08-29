import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { SERVICE_REQUEST_CONVERSION_PORT } from '../requests/domain/service-request-conversion.port';
import { ServiceOrdersController } from './controllers/service-orders.controller';
import { ServiceOrderPlanningController } from './controllers/service-order-planning.controller';
import { ServiceOrdersRepository } from './repositories/service-orders.repository';
import { ResourcePlanningRepository } from './repositories/resource-planning.repository';
import { ServiceOrdersAccessService } from './services/service-orders-access.service';
import { ServiceOrderPlanningAccessService } from './services/service-order-planning-access.service';
import { ServiceRequestConversionService } from './services/service-request-conversion.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [ServiceOrdersController, ServiceOrderPlanningController],
  providers: [
    ServiceOrdersRepository,
    ResourcePlanningRepository,
    ServiceOrdersAccessService,
    ServiceOrderPlanningAccessService,
    ServiceRequestConversionService,
    {
      provide: SERVICE_REQUEST_CONVERSION_PORT,
      useExisting: ServiceRequestConversionService,
    },
  ],
  exports: [
    SERVICE_REQUEST_CONVERSION_PORT,
    ServiceOrdersRepository,
    ServiceOrdersAccessService,
    ResourcePlanningRepository,
    ServiceOrderPlanningAccessService,
  ],
})
export class ServiceOrdersModule {}
