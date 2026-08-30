import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { ExecutiveDashboardAccessService } from '../services/executive-dashboard-access.service';

@Controller('dashboard/executive')
@UseGuards(JwtAuthGuard)
export class ExecutiveDashboardController {
  constructor(private readonly accessService: ExecutiveDashboardAccessService) {}

  @Get()
  getExecutive(
    @CurrentAuth() auth: AccessTokenClaims,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.accessService.getExecutiveSnapshot(
      { identityId: auth.sub, sessionId: auth.sid },
      { period, from, to, unitId },
    );
  }
}
