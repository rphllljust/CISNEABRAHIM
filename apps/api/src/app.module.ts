import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { CatalogModule } from './catalog/catalog.module';
import { ClientsModule } from './clients/clients.module';
import { CommercialModule } from './commercial/commercial.module';
import { HealthModule } from './health/health.module';
import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [HealthModule, AuditModule, AuthModule, AuthorizationModule, ClientsModule, CatalogModule, CommercialModule, ResourcesModule],
})
export class AppModule {}
