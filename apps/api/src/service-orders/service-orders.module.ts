import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { SERVICE_REQUEST_CONVERSION_PORT } from '../requests/domain/service-request-conversion.port';
import { ServiceOrderExecutionController } from './controllers/service-order-execution.controller';
import { ServiceOrdersController } from './controllers/service-orders.controller';
import { ServiceOrderPlanningController } from './controllers/service-order-planning.controller';
import { ServiceOrderExecutionRepository } from './repositories/service-order-execution.repository';
import { ServiceOrdersRepository } from './repositories/service-orders.repository';
import { ResourcePlanningRepository } from './repositories/resource-planning.repository';
import { ServiceOrderExecutionAccessService } from './services/service-order-execution-access.service';
import { ServiceOrdersAccessService } from './services/service-orders-access.service';
import { ServiceOrderPlanningAccessService } from './services/service-order-planning-access.service';
import { ServiceRequestConversionService } from './services/service-request-conversion.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [ServiceOrdersController, ServiceOrderPlanningController, ServiceOrderExecutionController],
  providers: [
    ServiceOrdersRepository,
    ResourcePlanningRepository,
    ServiceOrderExecutionRepository,
    ServiceOrdersAccessService,
    ServiceOrderPlanningAccessService,
    ServiceOrderExecutionAccessService,
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
    ServiceOrderExecutionAccessService,
  ],
})
export class ServiceOrdersModule {}
