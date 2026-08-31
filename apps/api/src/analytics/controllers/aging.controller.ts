import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { AgingAccessService } from '../services/aging-access.service';

@Controller('analytics/aging')
@UseGuards(JwtAuthGuard)
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
