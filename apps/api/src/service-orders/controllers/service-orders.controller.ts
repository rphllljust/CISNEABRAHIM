import { Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { parseCreateServiceOrderInput, parseListServiceOrdersQuery } from '../dto/service-orders.dto';
import { SERVICE_ORDERS_ERROR_CODES } from '../errors/service-orders-error-codes';
import { ServiceOrdersHttpException } from '../errors/service-orders-http.exception';
import { ServiceOrdersAccessService } from '../services/service-orders-access.service';

@Controller('service-orders')
@UseGuards(JwtAuthGuard)
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersAccess: ServiceOrdersAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    try {
      const input = parseCreateServiceOrderInput(request.body);
      return this.serviceOrdersAccess.create({ identityId: auth.sub, sessionId: auth.sid }, input);
    } catch {
      throw new ServiceOrdersHttpException(
        400,
        SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Get()
  list(@CurrentAuth() auth: AccessTokenClaims, @Query() query: Record<string, unknown>) {
    const parsed = parseListServiceOrdersQuery(query);
    return this.serviceOrdersAccess.list({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get(':serviceOrderId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('serviceOrderId') serviceOrderId: string) {
    return this.serviceOrdersAccess.getById(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
    );
  }
}
