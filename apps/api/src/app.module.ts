import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { CatalogModule } from './catalog/catalog.module';
import { ClientsModule } from './clients/clients.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule, AuditModule, AuthModule, AuthorizationModule, ClientsModule, CatalogModule],
})
export class AppModule {}
