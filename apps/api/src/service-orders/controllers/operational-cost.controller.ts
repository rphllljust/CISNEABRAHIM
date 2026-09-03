import { Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { validateRecordOperationalCostInput } from '../domain/operational-cost.validation';
import { SERVICE_ORDERS_ERROR_CODES } from '../errors/service-orders-error-codes';
import { ServiceOrdersHttpException } from '../errors/service-orders-http.exception';
import { OperationalCostAccessService } from '../services/operational-cost-access.service';

@Controller('service-orders/:serviceOrderId/operational-costs')
@UseGuards(JwtAuthGuard)
export class OperationalCostController {
  constructor(private readonly operationalCostAccess: OperationalCostAccessService) {}

  @Get()
  listByServiceOrder(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
  ) {
    return this.operationalCostAccess.listByServiceOrder(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
    );
  }

  @Post()
  @HttpCode(201)
  recordCost(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = validateRecordOperationalCostInput(request.body);
      return this.operationalCostAccess.recordCost(
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
