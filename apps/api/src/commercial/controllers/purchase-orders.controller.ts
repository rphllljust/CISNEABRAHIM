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
  parseCancelPurchaseOrderInput,
  parseCreatePurchaseOrderInput,
  parseLinkPurchaseOrderDocumentInput,
  parseListPurchaseOrdersQuery,
  parseRowVersionBody,
  parseUpdatePurchaseOrderDraftInput,
} from '../dto/purchase-orders.dto';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';
import { PurchaseOrdersAccessService } from '../services/purchase-orders-access.service';

@Controller('commercial/purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersAccess: PurchaseOrdersAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    try {
      const input = parseCreatePurchaseOrderInput(request.body);
      return this.purchaseOrdersAccess.create({ identityId: auth.sub, sessionId: auth.sid }, input);
    } catch {
      throw new CommercialHttpException(
        400,
        COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Get()
  list(@CurrentAuth() auth: AccessTokenClaims, @Query() query: Record<string, unknown>) {
    const parsed = parseListPurchaseOrdersQuery(query);
    return this.purchaseOrdersAccess.list({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get(':purchaseOrderId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('purchaseOrderId') purchaseOrderId: string) {
    return this.purchaseOrdersAccess.getById(
      { identityId: auth.sub, sessionId: auth.sid },
      purchaseOrderId,
    );
  }

  @Patch(':purchaseOrderId')
  updateDraft(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseUpdatePurchaseOrderDraftInput(request.body);
      return this.purchaseOrdersAccess.updateDraft(
        { identityId: auth.sub, sessionId: auth.sid },
        purchaseOrderId,
        input,
      );
    } catch {
      throw new CommercialHttpException(
        400,
        COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Post(':purchaseOrderId/register')
  @HttpCode(200)
  register(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRowVersionBody(request.body);
      return this.purchaseOrdersAccess.register(
        { identityId: auth.sub, sessionId: auth.sid },
        purchaseOrderId,
        input,
      );
    } catch {
      throw new CommercialHttpException(
        400,
        COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Post(':purchaseOrderId/cancel')
  @HttpCode(200)
  cancel(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseCancelPurchaseOrderInput(request.body);
      return this.purchaseOrdersAccess.cancel(
        { identityId: auth.sub, sessionId: auth.sid },
        purchaseOrderId,
        input,
      );
    } catch {
      throw new CommercialHttpException(
        400,
        COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Post(':purchaseOrderId/documents')
  @HttpCode(200)
  linkDocument(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseLinkPurchaseOrderDocumentInput(request.body);
      return this.purchaseOrdersAccess.linkDocument(
        { identityId: auth.sub, sessionId: auth.sid },
        purchaseOrderId,
        input,
      );
    } catch {
      throw new CommercialHttpException(
        400,
        COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }
}
