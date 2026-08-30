import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { EventsModule } from '../events/events.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { MeasurementsController } from './controllers/measurements.controller';
import { MeasurementsRepository } from './repositories/measurements.repository';
import { MeasurementsAccessService } from './services/measurements-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule, EventsModule, ServiceOrdersModule],
  controllers: [MeasurementsController],
  providers: [MeasurementsRepository, MeasurementsAccessService],
  exports: [MeasurementsRepository, MeasurementsAccessService],
})
export class MeasurementsModule {}
