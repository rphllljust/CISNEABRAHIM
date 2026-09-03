import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { validateProjectCashForecastInput } from '../domain/cash-flow-forecast.validation';
import { CashFlowForecastAccessService } from '../services/cash-flow-forecast-access.service';

@Controller('finance/cash-forecast')
@UseGuards(JwtAuthGuard)
export class CashFlowForecastController {
  constructor(private readonly forecast: CashFlowForecastAccessService) {}

  @Get()
  project(
    @CurrentAuth() auth: AccessTokenClaims,
    @Query('unitId') unitId: string,
    @Query('currencyCode') currencyCode: string,
    @Query('asOf') asOf?: string,
    @Query('horizonEndsOn') horizonEndsOn?: string,
  ) {
    return this.forecast.project(
      { identityId: auth.sub, sessionId: auth.sid },
      validateProjectCashForecastInput({ unitId, currencyCode, asOf, horizonEndsOn }),
    );
  }
}
