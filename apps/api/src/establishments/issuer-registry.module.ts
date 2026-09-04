import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import {
  CertificatesController,
  EstablishmentsController,
  LegalEntitiesController,
  TaxRegistrationsController,
} from './controllers/issuer-registry.controller';
import { EstablishmentRegistryRepository } from './repositories/establishment-registry.repository';
import { IssuerRegistryService } from './services/issuer-registry.service';

/**
 * Legal Establishment Master — cadastro da própria empresa emissora.
 * Fonte de verdade do emissor para FiscalDocument e billing (nada hardcoded).
 */
@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [
    LegalEntitiesController,
    EstablishmentsController,
    TaxRegistrationsController,
    CertificatesController,
  ],
  providers: [EstablishmentRegistryRepository, IssuerRegistryService],
  exports: [IssuerRegistryService],
})
export class IssuerRegistryModule {}
