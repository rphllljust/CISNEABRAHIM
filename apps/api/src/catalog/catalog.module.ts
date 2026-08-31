import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { ResourcesModule } from '../resources/resources.module';
import { ServiceDefinitionsController } from './controllers/service-definitions.controller';
import { UnitsOfMeasureController } from './controllers/units-of-measure.controller';
import { ServiceCatalogRepository } from './repositories/service-catalog.repository';
import { UnitsOfMeasureRepository } from './repositories/units-of-measure.repository';
import { ServiceCatalogAccessAuthz } from './services/service-catalog-access.authz';
import { ServiceCatalogAccessService } from './services/service-catalog-access.service';
import { ServiceCatalogReferenceValidationService } from './services/service-catalog-reference-validation.service';
import { UnitsOfMeasureAccessService } from './services/units-of-measure-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule, ResourcesModule],
  controllers: [ServiceDefinitionsController, UnitsOfMeasureController],
  providers: [
    ServiceCatalogRepository,
    UnitsOfMeasureRepository,
    ServiceCatalogAccessAuthz,
    ServiceCatalogReferenceValidationService,
    ServiceCatalogAccessService,
    UnitsOfMeasureAccessService,
  ],
  exports: [ServiceCatalogAccessService, UnitsOfMeasureAccessService, UnitsOfMeasureRepository],
})
export class CatalogModule {}
