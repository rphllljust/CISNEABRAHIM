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
  parseCreatePhysicalAssetInput,
  parseListPhysicalAssetsQuery,
  parsePhysicalAssetSummaryQuery,
  parsePhysicalAssetTransitionInput,
  parseUpdatePhysicalAssetInput,
} from '../dto/physical-assets.dto';
import { PhysicalAssetsAccessService } from '../services/physical-assets-access.service';

@Controller('resources/physical-assets')
@UseGuards(JwtAuthGuard)
export class PhysicalAssetsController {
  constructor(private readonly assetsAccess: PhysicalAssetsAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    const input = parseCreatePhysicalAssetInput(request.body);
    return this.assetsAccess.create({ identityId: auth.sub, sessionId: auth.sid }, input);
  }

  @Get()
  list(@CurrentAuth() auth: AccessTokenClaims, @Query() query: Record<string, unknown>) {
    const parsed = parseListPhysicalAssetsQuery(query);
    return this.assetsAccess.list({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get('summary')
  summary(@CurrentAuth() auth: AccessTokenClaims, @Query() query: Record<string, unknown>) {
    const parsed = parsePhysicalAssetSummaryQuery(query);
    return this.assetsAccess.summary({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get(':assetId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('assetId') assetId: string) {
    return this.assetsAccess.getById({ identityId: auth.sub, sessionId: auth.sid }, assetId);
  }

  @Patch(':assetId')
  update(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('assetId') assetId: string,
    @Req() request: FastifyRequest,
  ) {
    const input = parseUpdatePhysicalAssetInput(request.body);
    return this.assetsAccess.update({ identityId: auth.sub, sessionId: auth.sid }, assetId, input);
  }

  @Post(':assetId/deactivate')
  @HttpCode(200)
  deactivate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('assetId') assetId: string,
    @Req() request: FastifyRequest,
  ) {
    const body = parsePhysicalAssetTransitionInput(request.body);
    return this.assetsAccess.deactivate(
      { identityId: auth.sub, sessionId: auth.sid },
      assetId,
      body.version,
    );
  }

  @Post(':assetId/activate')
  @HttpCode(200)
  activate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('assetId') assetId: string,
    @Req() request: FastifyRequest,
  ) {
    const body = parsePhysicalAssetTransitionInput(request.body);
    return this.assetsAccess.activate(
      { identityId: auth.sub, sessionId: auth.sid },
      assetId,
      body.version,
    );
  }
}
