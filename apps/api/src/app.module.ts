import { Module } from '@nestjs/common';
import { IntegrationsAclModule } from './integrations/acl/integrations-acl.module';
import { IntegrationsInboxModule } from './integrations/inbox/integrations-inbox.module';
import { BackgroundJobsModule } from './platform/background-jobs/background-jobs.module';
import { OutboxModule } from './platform/outbox/outbox.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { CatalogModule } from './catalog/catalog.module';
import { ClientsModule } from './clients/clients.module';
import { CommercialModule } from './commercial/commercial.module';
import { DocumentsModule } from './documents/documents.module';
import { HealthModule } from './health/health.module';
import { RequestsModule } from './requests/requests.module';
import { ResourcesModule } from './resources/resources.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { BillingModule } from './billing/billing.module';
import { EventsModule } from './events/events.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';

@Module({
  imports: [HealthModule, AuditModule, AuthModule, AuthorizationModule, ClientsModule, CatalogModule, CommercialModule, RequestsModule, ServiceOrdersModule, MeasurementsModule, BillingModule, ResourcesModule, DocumentsModule, EventsModule, BackgroundJobsModule, OutboxModule, IntegrationsAclModule, IntegrationsInboxModule],
})
export class AppModule {}
