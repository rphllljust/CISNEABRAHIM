import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { ProductivityAccessService } from '../services/productivity-access.service';

@Controller('analytics/productivity')
@UseGuards(JwtAuthGuard)
export class ProductivityController {
  constructor(private readonly productivityAccessService: ProductivityAccessService) {}

  @Get()
  getProductivity(
    @CurrentAuth() auth: AccessTokenClaims,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: string,
    @Query('unitId') unitId?: string,
    @Query('archetype') archetype?: string,
  ) {
    return this.productivityAccessService.getProductivitySnapshot(
      { identityId: auth.sub, sessionId: auth.sid },
      { period, from, to, groupBy, unitId, archetype },
    );
  }
}
