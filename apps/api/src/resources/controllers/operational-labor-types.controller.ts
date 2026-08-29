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
  parseCreateOperationalLaborTypeInput,
  parseLaborTypeTransitionInput,
  parseListOperationalLaborTypesQuery,
  parseUpdateOperationalLaborTypeInput,
} from '../dto/operational-labor-types.dto';
import { OperationalLaborTypesAccessService } from '../services/operational-labor-types-access.service';

@Controller('resources/labor-types')
@UseGuards(JwtAuthGuard)
export class OperationalLaborTypesController {
  constructor(private readonly laborTypesAccess: OperationalLaborTypesAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    const input = parseCreateOperationalLaborTypeInput(request.body);
    return this.laborTypesAccess.create({ identityId: auth.sub, sessionId: auth.sid }, input);
  }

  @Get()
  list(@CurrentAuth() auth: AccessTokenClaims, @Query() query: Record<string, unknown>) {
    const parsed = parseListOperationalLaborTypesQuery(query);
    return this.laborTypesAccess.list({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get(':laborTypeId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('laborTypeId') laborTypeId: string) {
    return this.laborTypesAccess.getById({ identityId: auth.sub, sessionId: auth.sid }, laborTypeId);
  }

  @Patch(':laborTypeId')
  update(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('laborTypeId') laborTypeId: string,
    @Req() request: FastifyRequest,
  ) {
    const input = parseUpdateOperationalLaborTypeInput(request.body);
    return this.laborTypesAccess.update(
      { identityId: auth.sub, sessionId: auth.sid },
      laborTypeId,
      input,
    );
  }

  @Post(':laborTypeId/deactivate')
  @HttpCode(200)
  deactivate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('laborTypeId') laborTypeId: string,
    @Req() request: FastifyRequest,
  ) {
    const body = parseLaborTypeTransitionInput(request.body);
    return this.laborTypesAccess.deactivate(
      { identityId: auth.sub, sessionId: auth.sid },
      laborTypeId,
      body.version,
    );
  }

  @Post(':laborTypeId/activate')
  @HttpCode(200)
  activate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('laborTypeId') laborTypeId: string,
    @Req() request: FastifyRequest,
  ) {
    const body = parseLaborTypeTransitionInput(request.body);
    return this.laborTypesAccess.activate(
      { identityId: auth.sub, sessionId: auth.sid },
      laborTypeId,
      body.version,
    );
  }
}
