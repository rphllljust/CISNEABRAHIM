import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { CommercialPoliciesAccessService } from '../services/commercial-policies-access.service';

@Controller('commercial')
@UseGuards(JwtAuthGuard)
export class CommercialPoliciesController {
  constructor(private readonly policiesAccess: CommercialPoliciesAccessService) {}

  @Get('pricing-models')
  listPricingModels(@CurrentAuth() auth: AccessTokenClaims) {
    return this.policiesAccess.listPricingModels({ identityId: auth.sub, sessionId: auth.sid });
  }

  @Get('measurement-models')
  listMeasurementModels(@CurrentAuth() auth: AccessTokenClaims) {
    return this.policiesAccess.listMeasurementModels({ identityId: auth.sub, sessionId: auth.sid });
  }
}
