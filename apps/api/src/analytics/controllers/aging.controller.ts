import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { AnalyticsExceptionFilter } from '../errors/analytics-exception.filter';
import { AgingAccessService } from '../services/aging-access.service';

@Controller('analytics/aging')
@UseGuards(JwtAuthGuard)
@UseFilters(AnalyticsExceptionFilter)
export class AgingController {
  constructor(private readonly agingAccessService: AgingAccessService) {}

  @Get()
  getAging(@CurrentAuth() auth: AccessTokenClaims) {
    return this.agingAccessService.getAgingSnapshot({
      identityId: auth.sub,
      sessionId: auth.sid,
    });
  }
}
