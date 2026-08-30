import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DocumentsModule } from '../documents/documents.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { EventsModule } from '../events/events.module';
import { MeasurementsModule } from '../measurements/measurements.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { BillingController } from './controllers/billing.controller';
import { BillingDocumentController } from './controllers/billing-document.controller';
import { BillingRepository } from './repositories/billing.repository';
import { BillingDocumentRepository } from './repositories/billing-document.repository';
import { BillingAccessService } from './services/billing-access.service';
import { BillingDocumentAccessService } from './services/billing-document-access.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuthorizationModule,
    AuditModule,
    EventsModule,
    DocumentsModule,
    ServiceOrdersModule,
    MeasurementsModule,
  ],
  controllers: [BillingController, BillingDocumentController],
  providers: [
    BillingRepository,
    BillingDocumentRepository,
    BillingAccessService,
    BillingDocumentAccessService,
  ],
  exports: [
    BillingRepository,
    BillingDocumentRepository,
    BillingAccessService,
    BillingDocumentAccessService,
  ],
})
export class BillingModule {}
