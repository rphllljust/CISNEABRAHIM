import { Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { RequireAuthz } from '../decorators/require-authz.decorator';
import { parseCreateGrantInput } from '../dto/create-grant.dto';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { GrantAdminService } from '../services/grant-admin.service';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../types/authz-resources';

@Controller('authz')
export class AuthzGrantsController {
  constructor(private readonly grantAdminService: GrantAdminService) {}

  @Post('grants')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.GrantCreate,
    resourceType: AUTHZ_RESOURCE_TYPES.Grant,
  })
  async createGrant(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    const input = parseCreateGrantInput(request.body);
    return this.grantAdminService.createGrant({ identityId: auth.sub, sessionId: auth.sid }, input);
  }

  @Post('grants/:grantId/revoke')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.GrantRevoke,
    resourceType: AUTHZ_RESOURCE_TYPES.Grant,
  })
  async revokeGrant(@CurrentAuth() auth: AccessTokenClaims, @Param('grantId') grantId: string) {
    return this.grantAdminService.revokeGrant(
      { identityId: auth.sub, sessionId: auth.sid },
      grantId,
    );
  }
}

@Controller('authz')
export class AuthzProbeController {
  @Get('probe')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.ProbeExecute,
    resourceType: AUTHZ_RESOURCE_TYPES.Probe,
  })
  probe(@CurrentAuth() auth: AccessTokenClaims) {
    return {
      status: 'ok',
      identityId: auth.sub,
      sessionId: auth.sid,
    };
  }
}
