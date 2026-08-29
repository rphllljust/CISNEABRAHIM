import {
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import {
  parseCreatePhysicalResourceTypeInput,
  parseListPhysicalResourceTypesQuery,
  parsePhysicalResourceTypeTransitionInput,
  parseUpdatePhysicalResourceTypeInput,
} from '../dto/physical-resource-types.dto';
import { PhysicalResourceTypesAccessService } from '../services/physical-resource-types-access.service';

@Controller('resources/physical-resource-types')
@UseGuards(JwtAuthGuard)
export class PhysicalResourceTypesController {
  constructor(private readonly resourceTypesAccess: PhysicalResourceTypesAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    const input = parseCreatePhysicalResourceTypeInput(request.body);
    return this.resourceTypesAccess.create({ identityId: auth.sub, sessionId: auth.sid }, input);
  }

  @Get()
  list(@CurrentAuth() auth: AccessTokenClaims, @Query() query: Record<string, unknown>) {
    const parsed = parseListPhysicalResourceTypesQuery(query);
    return this.resourceTypesAccess.list({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get(':resourceTypeId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('resourceTypeId') resourceTypeId: string) {
    return this.resourceTypesAccess.getById(
      { identityId: auth.sub, sessionId: auth.sid },
      resourceTypeId,
    );
  }

  @Patch(':resourceTypeId')
  update(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('resourceTypeId') resourceTypeId: string,
    @Req() request: FastifyRequest,
  ) {
    const input = parseUpdatePhysicalResourceTypeInput(request.body);
    return this.resourceTypesAccess.update(
      { identityId: auth.sub, sessionId: auth.sid },
      resourceTypeId,
      input,
    );
  }

  @Post(':resourceTypeId/deactivate')
  @HttpCode(200)
  deactivate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('resourceTypeId') resourceTypeId: string,
    @Req() request: FastifyRequest,
  ) {
    const body = parsePhysicalResourceTypeTransitionInput(request.body);
    return this.resourceTypesAccess.deactivate(
      { identityId: auth.sub, sessionId: auth.sid },
      resourceTypeId,
      body.version,
    );
  }

  @Post(':resourceTypeId/activate')
  @HttpCode(200)
  activate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('resourceTypeId') resourceTypeId: string,
    @Req() request: FastifyRequest,
  ) {
    const body = parsePhysicalResourceTypeTransitionInput(request.body);
    return this.resourceTypesAccess.activate(
      { identityId: auth.sub, sessionId: auth.sid },
      resourceTypeId,
      body.version,
    );
  }
}
