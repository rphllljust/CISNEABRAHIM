import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AuthzGrantsController, AuthzProbeController } from './controllers/authz.controller';
import { AuthorizationGuard } from './guards/authorization.guard';
import { AuthorizationRepository } from './repositories/authorization.repository';
import { GrantAdminService } from './services/grant-admin.service';
import { PolicyDecisionPointService } from './services/policy-decision-point.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AuthzProbeController, AuthzGrantsController],
  providers: [
    AuthorizationRepository,
    PolicyDecisionPointService,
    GrantAdminService,
    AuthorizationGuard,
  ],
  exports: [PolicyDecisionPointService, AuthorizationGuard, AuthorizationRepository],
})
export class AuthorizationModule {}
