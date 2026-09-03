import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import type { ComputeThreeWayMatchInput } from '../domain/three-way-match.validation';
import { ThreeWayMatchAccessService } from '../services/three-way-match-access.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ThreeWayMatchController {
  constructor(private readonly matches: ThreeWayMatchAccessService) {}

  @Post('procurement/orders/:orderId/three-way-match')
  @HttpCode(201)
  compute(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('orderId') orderId: string,
    @Body() body: ComputeThreeWayMatchInput,
  ) {
    return this.matches.compute({ identityId: auth.sub, sessionId: auth.sid }, orderId, body);
  }

  @Get('three-way-matches/:matchId')
  get(@CurrentAuth() auth: AccessTokenClaims, @Param('matchId') matchId: string) {
    return this.matches.get({ identityId: auth.sub, sessionId: auth.sid }, matchId);
  }
}
