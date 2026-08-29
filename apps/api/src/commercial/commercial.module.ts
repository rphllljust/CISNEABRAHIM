import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CommercialPoliciesController } from './controllers/commercial-policies.controller';
import { CommercialPoliciesAccessService } from './services/commercial-policies-access.service';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [CommercialPoliciesController],
  providers: [CommercialPoliciesAccessService],
  exports: [CommercialPoliciesAccessService],
})
export class CommercialModule {}
