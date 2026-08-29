import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PhysicalResourceTypesController } from './controllers/physical-resource-types.controller';
import { PhysicalResourceTypesRepository } from './repositories/physical-resource-types.repository';
import { PhysicalResourceTypesAccessService } from './services/physical-resource-types-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [PhysicalResourceTypesController],
  providers: [PhysicalResourceTypesRepository, PhysicalResourceTypesAccessService],
  exports: [PhysicalResourceTypesRepository, PhysicalResourceTypesAccessService],
})
export class ResourcesModule {}
