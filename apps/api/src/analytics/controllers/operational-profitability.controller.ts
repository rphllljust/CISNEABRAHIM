import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { OperationalProfitabilityAccessService } from '../services/operational-profitability-access.service';

@Controller('analytics/operational-profitability')
@UseGuards(JwtAuthGuard)
export class OperationalProfitabilityController {
  constructor(
    private readonly operationalProfitabilityAccessService: OperationalProfitabilityAccessService,
  ) {}

  @Get()
  getOperationalProfitability(
    @CurrentAuth() auth: AccessTokenClaims,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: string,
    @Query('unitId') unitId?: string,
    @Query('serviceType') serviceType?: string,
    @Query('serviceOrderId') serviceOrderId?: string,
    @Query('clientId') clientId?: string,
    @Query('contractReference') contractReference?: string,
  ) {
    return this.operationalProfitabilityAccessService.getOperationalProfitabilitySnapshot(
      { identityId: auth.sub, sessionId: auth.sid },
      {
        period,
        from,
        to,
        groupBy,
        unitId,
        serviceType,
        serviceOrderId,
        clientId,
        contractReference,
      },
    );
  }
}
