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
  parseCreateUnitOfMeasureInput,
  parseListUnitsOfMeasureQuery,
  parseUnitTransitionInput,
  parseUpdateUnitOfMeasureInput,
} from '../dto/units-of-measure.dto';
import { UnitsOfMeasureAccessService } from '../services/units-of-measure-access.service';

@Controller('catalog/units-of-measure')
@UseGuards(JwtAuthGuard)
export class UnitsOfMeasureController {
  constructor(private readonly unitsAccess: UnitsOfMeasureAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    const input = parseCreateUnitOfMeasureInput(request.body);
    return this.unitsAccess.create({ identityId: auth.sub, sessionId: auth.sid }, input);
  }

  @Get()
  list(@CurrentAuth() auth: AccessTokenClaims, @Query() query: Record<string, unknown>) {
    const parsed = parseListUnitsOfMeasureQuery(query);
    return this.unitsAccess.list({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get(':unitId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('unitId') unitId: string) {
    return this.unitsAccess.getById({ identityId: auth.sub, sessionId: auth.sid }, unitId);
  }

  @Patch(':unitId')
  update(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('unitId') unitId: string,
    @Req() request: FastifyRequest,
  ) {
    const input = parseUpdateUnitOfMeasureInput(request.body);
    return this.unitsAccess.update({ identityId: auth.sub, sessionId: auth.sid }, unitId, input);
  }

  @Post(':unitId/deactivate')
  @HttpCode(200)
  deactivate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('unitId') unitId: string,
    @Req() request: FastifyRequest,
  ) {
    const body = parseUnitTransitionInput(request.body);
    return this.unitsAccess.deactivate(
      { identityId: auth.sub, sessionId: auth.sid },
      unitId,
      body.version,
    );
  }

  @Post(':unitId/activate')
  @HttpCode(200)
  activate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('unitId') unitId: string,
    @Req() request: FastifyRequest,
  ) {
    const body = parseUnitTransitionInput(request.body);
    return this.unitsAccess.activate(
      { identityId: auth.sub, sessionId: auth.sid },
      unitId,
      body.version,
    );
  }
}
