import { Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import {
  parseRecordEvidenceInput,
  parseRecordMeasuredValueInput,
  parseRecordObservationInput,
  parseRecordOccurrenceInput,
  parseRecordQuantityInput,
} from '../dto/service-order-execution.dto';
import { validateRowVersionCommandInput } from '../domain/service-order-execution.validation';
import { SERVICE_ORDERS_ERROR_CODES } from '../errors/service-orders-error-codes';
import { ServiceOrdersHttpException } from '../errors/service-orders-http.exception';
import { ServiceOrderExecutionAccessService } from '../services/service-order-execution-access.service';

function parseTransitionBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    throw new Error('VALIDATION_FAILED');
  }
  return validateRowVersionCommandInput(body);
}

@Controller('service-orders/:serviceOrderId/execution')
@UseGuards(JwtAuthGuard)
export class ServiceOrderExecutionController {
  constructor(private readonly executionAccess: ServiceOrderExecutionAccessService) {}

  @Get()
  getExecution(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
  ) {
    return this.executionAccess.getExecution({ identityId: auth.sub, sessionId: auth.sid }, serviceOrderId);
  }

  @Post('start')
  @HttpCode(200)
  start(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.executionAccess.start(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      parseTransitionBody(request.body),
    );
  }

  @Post('pause')
  @HttpCode(200)
  pause(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.executionAccess.pause(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      parseTransitionBody(request.body),
    );
  }

  @Post('resume')
  @HttpCode(200)
  resume(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.executionAccess.resume(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      parseTransitionBody(request.body),
    );
  }

  @Post('complete')
  @HttpCode(200)
  complete(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.executionAccess.complete(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
      parseTransitionBody(request.body),
    );
  }

  @Post('entries/quantity')
  @HttpCode(201)
  recordQuantity(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRecordQuantityInput(request.body);
      return this.executionAccess.recordQuantity(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        input,
      );
    } catch {
      throw validationFailed();
    }
  }

  @Post('entries/mileage')
  @HttpCode(201)
  recordMileage(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRecordMeasuredValueInput(request.body);
      return this.executionAccess.recordMileage(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        input,
      );
    } catch {
      throw validationFailed();
    }
  }

  @Post('entries/hour-meter')
  @HttpCode(201)
  recordHourMeter(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRecordMeasuredValueInput(request.body);
      return this.executionAccess.recordHourMeter(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        input,
      );
    } catch {
      throw validationFailed();
    }
  }

  @Post('entries/observation')
  @HttpCode(201)
  recordObservation(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRecordObservationInput(request.body);
      return this.executionAccess.recordObservation(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        input,
      );
    } catch {
      throw validationFailed();
    }
  }

  @Post('occurrences')
  @HttpCode(201)
  recordOccurrence(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRecordOccurrenceInput(request.body);
      return this.executionAccess.recordOccurrence(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        input,
      );
    } catch {
      throw validationFailed();
    }
  }

  @Post('evidence')
  @HttpCode(201)
  recordEvidence(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRecordEvidenceInput(request.body);
      return this.executionAccess.recordEvidence(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        input,
      );
    } catch {
      throw validationFailed();
    }
  }
}

function validationFailed(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    400,
    SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
    'Invalid request body.',
  );
}
