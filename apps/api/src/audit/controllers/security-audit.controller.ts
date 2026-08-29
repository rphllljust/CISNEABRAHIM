import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequireAuthz } from '../../authorization/decorators/require-authz.decorator';
import { AuthorizationGuard } from '../../authorization/guards/authorization.guard';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { SecurityAuditRepository } from '../repositories/security-audit.repository';

@Controller('audit')
export class SecurityAuditController {
  constructor(private readonly repository: SecurityAuditRepository) {}

  @Get('security-events')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.PlatformDiagnosticsRead,
    resourceType: AUTHZ_RESOURCE_TYPES.Platform,
  })
  async listSecurityEvents(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 50;
    const events = await this.repository.listRecent(Number.isFinite(parsedLimit) ? parsedLimit : 50);
    return { events };
  }
}
