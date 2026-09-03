import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import type {
  RecordCollectionActionInput,
  RecordCollectionPromiseInput,
  RenegotiateCollectionInput,
} from '../domain/collection.validation';
import { CollectionsAccessService } from '../services/collections-access.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collections: CollectionsAccessService) {}

  @Post('finance/receivables/:receivableId/collections')
  @HttpCode(201)
  open(@CurrentAuth() auth: AccessTokenClaims, @Param('receivableId') receivableId: string) {
    return this.collections.open({ identityId: auth.sub, sessionId: auth.sid }, receivableId);
  }

  @Get('finance/receivables/:receivableId/collections/current')
  getCurrent(@CurrentAuth() auth: AccessTokenClaims, @Param('receivableId') receivableId: string) {
    return this.collections.getCurrent({ identityId: auth.sub, sessionId: auth.sid }, receivableId);
  }

  @Post('finance/collections/:collectionId/actions')
  recordAction(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('collectionId') collectionId: string,
    @Body() body: RecordCollectionActionInput,
  ) {
    return this.collections.recordAction(
      { identityId: auth.sub, sessionId: auth.sid },
      collectionId,
      body,
    );
  }

  @Post('finance/collections/:collectionId/promises')
  recordPromise(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('collectionId') collectionId: string,
    @Body() body: RecordCollectionPromiseInput,
  ) {
    return this.collections.recordPromise(
      { identityId: auth.sub, sessionId: auth.sid },
      collectionId,
      body,
    );
  }

  @Post('finance/collections/:collectionId/renegotiations')
  renegotiate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('collectionId') collectionId: string,
    @Body() body: RenegotiateCollectionInput,
  ) {
    return this.collections.renegotiate(
      { identityId: auth.sub, sessionId: auth.sid },
      collectionId,
      body,
    );
  }

  @Get('finance/collections/:collectionId/history')
  listHistory(@CurrentAuth() auth: AccessTokenClaims, @Param('collectionId') collectionId: string) {
    return this.collections.listHistory({ identityId: auth.sub, sessionId: auth.sid }, collectionId);
  }
}
