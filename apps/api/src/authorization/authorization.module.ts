import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AuthzGrantsController, AuthzProbeController } from './controllers/authz.controller';
import { ScopedRecordController } from './controllers/scoped-record.controller';
import { AuthorizationGuard } from './guards/authorization.guard';
import { AuthorizationRepository } from './repositories/authorization.repository';
import { ScopeContextRepository } from './repositories/scope-context.repository';
import { GrantAdminService } from './services/grant-admin.service';
import { PolicyDecisionPointService } from './services/policy-decision-point.service';
import { ScopeEnforcementService } from './services/scope-enforcement.service';
import { ScopeResolverService } from './services/scope-resolver.service';
import { ScopedRecordAccessService } from './services/scoped-record-access.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AuthzProbeController, AuthzGrantsController, ScopedRecordController],
  providers: [
    AuthorizationRepository,
    ScopeContextRepository,
    PolicyDecisionPointService,
    ScopeResolverService,
    ScopeEnforcementService,
    GrantAdminService,
    ScopedRecordAccessService,
    AuthorizationGuard,
  ],
  exports: [
    PolicyDecisionPointService,
    AuthorizationGuard,
    AuthorizationRepository,
    ScopeEnforcementService,
    ScopeResolverService,
  ],
})
export class AuthorizationModule {}
