import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { CommercialPoliciesController } from './controllers/commercial-policies.controller';
import { ContractsController } from './controllers/contracts.controller';
import { PurchaseOrdersController } from './controllers/purchase-orders.controller';
import { ProposalsController } from './controllers/proposals.controller';
import { ContractsRepository } from './repositories/contracts.repository';
import { PurchaseOrdersRepository } from './repositories/purchase-orders.repository';
import { ProposalsRepository } from './repositories/proposals.repository';
import { CommercialPoliciesAccessService } from './services/commercial-policies-access.service';
import { ProposalsAccessAuthz } from './services/proposals-access.authz';
import { ProposalsAccessService } from './services/proposals-access.service';
import { ProposalsReferenceValidationService } from './services/proposals-reference-validation.service';
import { ContractsAccessAuthz } from './services/contracts-access.authz';
import { ContractsAccessService } from './services/contracts-access.service';
import { ContractsOperationalValidationService } from './services/contracts-operational-validation.service';
import { ContractsReferenceValidationService } from './services/contracts-reference-validation.service';
import { PurchaseOrdersAccessAuthz } from './services/purchase-orders-access.authz';
import { PurchaseOrdersAccessService } from './services/purchase-orders-access.service';
import { PurchaseOrdersReferenceValidationService } from './services/purchase-orders-reference-validation.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [
    CommercialPoliciesController,
    ProposalsController,
    PurchaseOrdersController,
    ContractsController,
  ],
  providers: [
    CommercialPoliciesAccessService,
    ProposalsRepository,
    ProposalsAccessAuthz,
    ProposalsReferenceValidationService,
    ProposalsAccessService,
    PurchaseOrdersRepository,
    PurchaseOrdersAccessAuthz,
    PurchaseOrdersReferenceValidationService,
    PurchaseOrdersAccessService,
    ContractsRepository,
    ContractsAccessAuthz,
    ContractsReferenceValidationService,
    ContractsAccessService,
    ContractsOperationalValidationService,
  ],
  exports: [
    CommercialPoliciesAccessService,
    ProposalsRepository,
    ProposalsAccessService,
    PurchaseOrdersRepository,
    PurchaseOrdersAccessService,
    ContractsRepository,
    ContractsOperationalValidationService,
  ],
})
export class CommercialModule {}
