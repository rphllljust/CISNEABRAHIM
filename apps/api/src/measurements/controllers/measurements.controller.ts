import { Controller, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import {
  validateAuthorizeMeasurementAdjustmentInput,
  validateRejectMeasurementInput,
  validateRowVersionCommandInput,
  validateUpdateMeasurementItemInput,
} from '../domain/measurement.validation';
import { MeasurementsAccessService } from '../services/measurements-access.service';

function parseTransitionBody(body: unknown) {
  return validateRowVersionCommandInput(body);
}

@Controller('service-orders/:serviceOrderId/measurements')
@UseGuards(JwtAuthGuard)
export class MeasurementsController {
  constructor(private readonly measurementsAccess: MeasurementsAccessService) {}

  @Get()
  getByServiceOrder(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
  ) {
    return this.measurementsAccess.getByServiceOrder(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
    );
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
  ) {
    return this.measurementsAccess.create({ identityId: auth.sub, sessionId: auth.sid }, serviceOrderId);
  }

  @Get(':measurementId')
  getById(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('measurementId') measurementId: string,
  ) {
    return this.measurementsAccess.getById(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      measurementId,
    );
  }

  @Post(':measurementId/regenerate')
  @HttpCode(200)
  regenerate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('measurementId') measurementId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.measurementsAccess.regenerate(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      measurementId,
      parseTransitionBody(request.body),
    );
  }

  @Patch(':measurementId/items/:itemId')
  updateItem(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('measurementId') measurementId: string,
    @Param('itemId') itemId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.measurementsAccess.updateItem(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      measurementId,
      itemId,
      validateUpdateMeasurementItemInput(request.body),
    );
  }

  @Post(':measurementId/adjustments')
  @HttpCode(200)
  authorizeAdjustment(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('measurementId') measurementId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.measurementsAccess.authorizeAdjustment(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      measurementId,
      validateAuthorizeMeasurementAdjustmentInput(request.body),
    );
  }

  @Post(':measurementId/submit')
  @HttpCode(200)
  submit(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('measurementId') measurementId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.measurementsAccess.submit(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      measurementId,
      parseTransitionBody(request.body),
    );
  }

  @Post(':measurementId/start-review')
  @HttpCode(200)
  startReview(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('measurementId') measurementId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.measurementsAccess.startReview(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      measurementId,
      parseTransitionBody(request.body),
    );
  }

  @Post(':measurementId/approve')
  @HttpCode(200)
  approve(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('measurementId') measurementId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.measurementsAccess.approve(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      measurementId,
      parseTransitionBody(request.body),
    );
  }

  @Post(':measurementId/reject')
  @HttpCode(200)
  reject(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('measurementId') measurementId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.measurementsAccess.reject(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      measurementId,
      validateRejectMeasurementInput(request.body),
    );
  }

  @Post(':measurementId/resubmit')
  @HttpCode(200)
  resubmit(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('measurementId') measurementId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.measurementsAccess.resubmit(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      measurementId,
      parseTransitionBody(request.body),
    );
  }
}
