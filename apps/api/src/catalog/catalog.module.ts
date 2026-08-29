import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { ServiceDefinitionsController } from './controllers/service-definitions.controller';
import { ServiceCatalogRepository } from './repositories/service-catalog.repository';
import { ServiceCatalogAccessService } from './services/service-catalog-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [ServiceDefinitionsController],
  providers: [ServiceCatalogRepository, ServiceCatalogAccessService],
  exports: [ServiceCatalogAccessService],
})
export class CatalogModule {}
