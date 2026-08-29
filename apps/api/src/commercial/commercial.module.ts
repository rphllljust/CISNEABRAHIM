import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { CommercialPoliciesController } from './controllers/commercial-policies.controller';
import { ProposalsController } from './controllers/proposals.controller';
import { ProposalsRepository } from './repositories/proposals.repository';
import { CommercialPoliciesAccessService } from './services/commercial-policies-access.service';
import { ProposalsAccessService } from './services/proposals-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [CommercialPoliciesController, ProposalsController],
  providers: [
    CommercialPoliciesAccessService,
    ProposalsRepository,
    ProposalsAccessService,
  ],
  exports: [CommercialPoliciesAccessService, ProposalsRepository, ProposalsAccessService],
})
export class CommercialModule {}
