import { Module } from '@nestjs/common';
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
import { ServiceOrdersModule } from './service-orders/service-orders.module';

@Module({
  imports: [HealthModule, AuditModule, AuthModule, AuthorizationModule, ClientsModule, CatalogModule, CommercialModule, RequestsModule, ServiceOrdersModule, ResourcesModule, DocumentsModule],
})
export class AppModule {}
