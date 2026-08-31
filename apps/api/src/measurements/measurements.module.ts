import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { OutboxModule } from '../platform/outbox/outbox.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { MeasurementsController } from './controllers/measurements.controller';
import { MeasurementsRepository } from './repositories/measurements.repository';
import { MeasurementsAccessAuthz } from './services/measurements-access.authz';
import { MeasurementsAccessService } from './services/measurements-access.service';
import { MeasurementsCommercialResolutionService } from './services/measurements-commercial-resolution.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule, OutboxModule, ServiceOrdersModule],
  controllers: [MeasurementsController],
  providers: [
    MeasurementsRepository,
    MeasurementsAccessAuthz,
    MeasurementsCommercialResolutionService,
    MeasurementsAccessService,
  ],
  exports: [MeasurementsRepository, MeasurementsAccessService],
})
export class MeasurementsModule {}
