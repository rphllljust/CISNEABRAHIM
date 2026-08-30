import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { OperationalDashboardAccessService } from '../services/operational-dashboard-access.service';

@Controller('dashboard/operational')
@UseGuards(JwtAuthGuard)
export class OperationalDashboardController {
  constructor(private readonly accessService: OperationalDashboardAccessService) {}

  @Get()
  getOperational(@CurrentAuth() auth: AccessTokenClaims) {
    return this.accessService.getOperationalSnapshot({
      identityId: auth.sub,
      sessionId: auth.sid,
    });
  }
}
