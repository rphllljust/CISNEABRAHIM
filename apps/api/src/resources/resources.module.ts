import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { OperationalLaborTypesController } from './controllers/operational-labor-types.controller';
import { PhysicalResourceTypesController } from './controllers/physical-resource-types.controller';
import { OperationalLaborTypesRepository } from './repositories/operational-labor-types.repository';
import { PhysicalResourceTypesRepository } from './repositories/physical-resource-types.repository';
import { OperationalLaborTypesAccessService } from './services/operational-labor-types-access.service';
import { PhysicalResourceTypesAccessService } from './services/physical-resource-types-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [PhysicalResourceTypesController, OperationalLaborTypesController],
  providers: [
    PhysicalResourceTypesRepository,
    PhysicalResourceTypesAccessService,
    OperationalLaborTypesRepository,
    OperationalLaborTypesAccessService,
  ],
  exports: [
    PhysicalResourceTypesRepository,
    PhysicalResourceTypesAccessService,
    OperationalLaborTypesRepository,
    OperationalLaborTypesAccessService,
  ],
})
export class ResourcesModule {}
