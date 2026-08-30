import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { BusinessAlertAccessService } from '../services/business-alert-access.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class BusinessAlertsController {
  constructor(private readonly accessService: BusinessAlertAccessService) {}

  @Get()
  listAlerts(
    @CurrentAuth() auth: AccessTokenClaims,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accessService.listAlerts(
      { identityId: auth.sub, sessionId: auth.sid },
      { status, type, severity, limit },
    );
  }

  @Get('summary')
  getSummary(@CurrentAuth() auth: AccessTokenClaims) {
    return this.accessService.getSummary({ identityId: auth.sub, sessionId: auth.sid });
  }
}
