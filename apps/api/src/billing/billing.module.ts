import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { MeasurementsModule } from '../measurements/measurements.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { BillingController } from './controllers/billing.controller';
import { BillingRepository } from './repositories/billing.repository';
import { BillingAccessService } from './services/billing-access.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuthorizationModule,
    AuditModule,
    ServiceOrdersModule,
    MeasurementsModule,
  ],
  controllers: [BillingController],
  providers: [BillingRepository, BillingAccessService],
  exports: [BillingRepository, BillingAccessService],
})
export class BillingModule {}
