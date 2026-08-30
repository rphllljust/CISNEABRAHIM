import { Controller, Get, HttpCode, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import {
  validateCancelBillingDocumentInput,
  validateIssueBillingDocumentInput,
  validateReplaceBillingDocumentInput,
} from '../domain/billing-document.validation';
import { BillingDocumentAccessService } from '../services/billing-document-access.service';

@Controller('service-orders/:serviceOrderId/billing-records/:billingRecordId/documents')
@UseGuards(JwtAuthGuard)
export class BillingDocumentController {
  constructor(private readonly billingDocumentAccess: BillingDocumentAccessService) {}

  @Get()
  list(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('billingRecordId') billingRecordId: string,
  ) {
    return this.billingDocumentAccess.listByBillingRecord(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      billingRecordId,
    );
  }

  @Post()
  @HttpCode(201)
  issue(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('billingRecordId') billingRecordId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.billingDocumentAccess.issue(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      billingRecordId,
      validateIssueBillingDocumentInput(request.body as never),
    );
  }

  @Get(':billingDocumentId')
  getById(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('billingRecordId') billingRecordId: string,
    @Param('billingDocumentId') billingDocumentId: string,
  ) {
    return this.billingDocumentAccess.getById(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      billingRecordId,
      billingDocumentId,
    );
  }

  @Get(':billingDocumentId/pdf')
  async downloadPdf(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('billingRecordId') billingRecordId: string,
    @Param('billingDocumentId') billingDocumentId: string,
    @Res() response: FastifyReply,
  ) {
    const artifact = await this.billingDocumentAccess.downloadPdf(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      billingRecordId,
      billingDocumentId,
    );

    void response
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${artifact.filename}"`)
      .header('X-Content-Sha256', artifact.sha256)
      .send(artifact.buffer);
  }

  @Post(':billingDocumentId/cancel')
  @HttpCode(200)
  cancel(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('billingRecordId') billingRecordId: string,
    @Param('billingDocumentId') billingDocumentId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.billingDocumentAccess.cancel(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      billingRecordId,
      billingDocumentId,
      validateCancelBillingDocumentInput(request.body as never),
    );
  }

  @Post(':billingDocumentId/replace')
  @HttpCode(201)
  replace(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('billingRecordId') billingRecordId: string,
    @Param('billingDocumentId') billingDocumentId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.billingDocumentAccess.replace(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      billingRecordId,
      billingDocumentId,
      validateReplaceBillingDocumentInput(request.body as never),
    );
  }
}
