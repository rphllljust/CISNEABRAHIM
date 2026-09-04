import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { RequireAuthz } from '../decorators/require-authz.decorator';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../types/authz-resources';
import { AccessAdminService } from '../services/access-admin.service';
import {
  parseAssignAccessRoleInput,
  parseCreateAccessRoleInput,
  parseUpdateAccessRoleInput,
} from '../dto/access-admin.dto';

@Controller('authz/access-admin')
export class AccessAdminController {
  constructor(private readonly accessAdmin: AccessAdminService) {}

  @Get('catalog')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.AccessAdminRead,
    resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
  })
  catalog(@CurrentAuth() auth: AccessTokenClaims) {
    return this.accessAdmin.catalog({ identityId: auth.sub, sessionId: auth.sid });
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.AccessAdminRead,
    resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
  })
  listRoles(@CurrentAuth() auth: AccessTokenClaims) {
    return this.accessAdmin.listRoles({ identityId: auth.sub, sessionId: auth.sid });
  }

  @Get('roles/:code')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.AccessAdminRead,
    resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
  })
  getRole(@CurrentAuth() auth: AccessTokenClaims, @Param('code') code: string) {
    return this.accessAdmin.getRole({ identityId: auth.sub, sessionId: auth.sid }, code);
  }

  @Post('roles')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.AccessAdminManage,
    resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
  })
  createRole(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    const command = parseCreateAccessRoleInput(request.body);
    return this.accessAdmin.createRole({ identityId: auth.sub, sessionId: auth.sid }, command);
  }

  @Put('roles/:code')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.AccessAdminManage,
    resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
  })
  updateRole(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('code') code: string,
    @Req() request: FastifyRequest,
  ) {
    const command = parseUpdateAccessRoleInput(request.body);
    return this.accessAdmin.updateRole({ identityId: auth.sub, sessionId: auth.sid }, code, command);
  }

  @Get('assignments')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.AccessAdminRead,
    resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
  })
  listAssignments(
    @CurrentAuth() auth: AccessTokenClaims,
    @Query('identityId') identityId?: string,
  ) {
    return this.accessAdmin.listAssignments(
      { identityId: auth.sub, sessionId: auth.sid },
      identityId,
    );
  }

  @Post('assignments')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.AccessAdminManage,
    resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
  })
  assignRole(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    const command = parseAssignAccessRoleInput(request.body);
    return this.accessAdmin.assignRole({ identityId: auth.sub, sessionId: auth.sid }, command);
  }

  @Post('assignments/:assignmentId/revoke')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.AccessAdminManage,
    resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
  })
  revokeAssignment(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.accessAdmin.revokeAssignment(
      { identityId: auth.sub, sessionId: auth.sid },
      assignmentId,
    );
  }

  @Get('sod-conflicts')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireAuthz({
    action: AUTHZ_ACTIONS.AccessAdminRead,
    resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
  })
  sodConflicts(@CurrentAuth() auth: AccessTokenClaims) {
    return this.accessAdmin.sodConflicts({ identityId: auth.sub, sessionId: auth.sid });
  }
}
