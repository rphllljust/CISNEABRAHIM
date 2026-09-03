import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import {
  validateAcquireFixedAssetInput,
  validateDisposeFixedAssetInput,
  validateRegisterFixedAssetInput,
  validateReverseFixedAssetInput,
  validateTransferFixedAssetInput,
} from '../domain/fixed-asset-accounting.validation';
import { FixedAssetAccountingAccessService } from '../services/fixed-asset-accounting-access.service';

@Controller('accounting/fixed-assets')
@UseGuards(JwtAuthGuard)
export class FixedAssetAccountingController {
  constructor(private readonly fixedAssets: FixedAssetAccountingAccessService) {}

  @Post()
  @HttpCode(200)
  register(@CurrentAuth() auth: AccessTokenClaims, @Body() body: never) {
    return this.fixedAssets.register(
      { identityId: auth.sub, sessionId: auth.sid },
      validateRegisterFixedAssetInput(body),
    );
  }

  @Get(':registerId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('registerId') registerId: string) {
    return this.fixedAssets.getById({ identityId: auth.sub, sessionId: auth.sid }, registerId);
  }

  @Get()
  getByOperationalAsset(
    @CurrentAuth() auth: AccessTokenClaims,
    @Query('unitId') unitId: string,
    @Query('operationalAssetId') operationalAssetId: string,
  ) {
    return this.fixedAssets.getByOperationalAsset(
      { identityId: auth.sub, sessionId: auth.sid },
      unitId,
      operationalAssetId,
    );
  }

  @Post(':registerId/acquire')
  @HttpCode(200)
  acquire(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('registerId') registerId: string,
    @Body() body: never,
  ) {
    return this.fixedAssets.acquire(
      { identityId: auth.sub, sessionId: auth.sid },
      registerId,
      validateAcquireFixedAssetInput(body),
    );
  }

  @Post(':registerId/dispose')
  @HttpCode(200)
  dispose(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('registerId') registerId: string,
    @Body() body: never,
  ) {
    return this.fixedAssets.dispose(
      { identityId: auth.sub, sessionId: auth.sid },
      registerId,
      validateDisposeFixedAssetInput(body),
    );
  }

  @Post(':registerId/transfer')
  @HttpCode(200)
  transfer(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('registerId') registerId: string,
    @Body() body: never,
  ) {
    return this.fixedAssets.transfer(
      { identityId: auth.sub, sessionId: auth.sid },
      registerId,
      validateTransferFixedAssetInput(body),
    );
  }

  @Post(':registerId/reverse')
  @HttpCode(200)
  reverse(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('registerId') registerId: string,
    @Body() body: never,
  ) {
    return this.fixedAssets.reverseAcquisition(
      { identityId: auth.sub, sessionId: auth.sid },
      registerId,
      validateReverseFixedAssetInput(body),
    );
  }

  @Post(':registerId/depreciate')
  @HttpCode(200)
  depreciate() {
    return this.fixedAssets.depreciate();
  }
}
