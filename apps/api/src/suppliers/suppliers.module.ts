import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { ENTERPRISE_CORE_PORT } from '../platform/bounded-contexts/enterprise-core-ports';
import { SuppliersController } from './controllers/suppliers.controller';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { SupplierAccessAuthz } from './services/supplier-access.authz';
import { SupplierAccessService } from './services/supplier-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [SuppliersController],
  providers: [
    SuppliersRepository,
    SupplierAccessAuthz,
    SupplierAccessService,
    {
      provide: ENTERPRISE_CORE_PORT.CommercialSupplier,
      useExisting: SupplierAccessService,
    },
  ],
  exports: [SupplierAccessService, ENTERPRISE_CORE_PORT.CommercialSupplier],
})
export class SuppliersModule {}
