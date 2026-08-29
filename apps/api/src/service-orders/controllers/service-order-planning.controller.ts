import { Controller, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import {
  parseAllocateResourceInput,
  parsePlanResourceInput,
  parseReallocateResourceInput,
  parseRemoveAllocationInput,
  parseRemovePlannedResourceInput,
  parseUpdatePlannedResourceInput,
} from '../dto/resource-planning.dto';
import { SERVICE_ORDERS_ERROR_CODES } from '../errors/service-orders-error-codes';
import { ServiceOrdersHttpException } from '../errors/service-orders-http.exception';
import { ServiceOrderPlanningAccessService } from '../services/service-order-planning-access.service';

@Controller('service-orders/:serviceOrderId')
@UseGuards(JwtAuthGuard)
export class ServiceOrderPlanningController {
  constructor(private readonly planningAccess: ServiceOrderPlanningAccessService) {}

  @Get('planned-resources')
  listPlannedResources(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
  ) {
    return this.planningAccess.listPlannedResources(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
    );
  }

  @Post('planned-resources')
  @HttpCode(201)
  planResource(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parsePlanResourceInput(request.body);
      return this.planningAccess.planResource(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        input,
      );
    } catch {
      throw new ServiceOrdersHttpException(
        400,
        SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Patch('planned-resources/:plannedResourceId')
  updatePlannedResource(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('plannedResourceId') plannedResourceId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseUpdatePlannedResourceInput(request.body);
      return this.planningAccess.updatePlannedResource(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        plannedResourceId,
        input,
      );
    } catch {
      throw new ServiceOrdersHttpException(
        400,
        SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Post('planned-resources/:plannedResourceId/remove')
  @HttpCode(200)
  removePlannedResource(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('plannedResourceId') plannedResourceId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRemovePlannedResourceInput(request.body);
      return this.planningAccess.removePlannedResource(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        plannedResourceId,
        input,
      );
    } catch {
      throw new ServiceOrdersHttpException(
        400,
        SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Get('allocations')
  listAllocations(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
  ) {
    return this.planningAccess.listAllocations(
      { identityId: auth.sub, sessionId: auth.sid },
      serviceOrderId,
    );
  }

  @Post('allocations')
  @HttpCode(201)
  allocateResource(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseAllocateResourceInput(request.body);
      return this.planningAccess.allocateResource(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        input,
      );
    } catch {
      throw new ServiceOrdersHttpException(
        400,
        SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Post('allocations/:allocationId/reallocate')
  @HttpCode(200)
  reallocateResource(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('allocationId') allocationId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseReallocateResourceInput(request.body);
      return this.planningAccess.reallocateResource(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        allocationId,
        input,
      );
    } catch {
      throw new ServiceOrdersHttpException(
        400,
        SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  @Post('allocations/:allocationId/remove')
  @HttpCode(200)
  removeAllocation(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('serviceOrderId') serviceOrderId: string,
    @Param('allocationId') allocationId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRemoveAllocationInput(request.body);
      return this.planningAccess.removeAllocation(
        { identityId: auth.sub, sessionId: auth.sid },
        serviceOrderId,
        allocationId,
        input,
      );
    } catch {
      throw new ServiceOrdersHttpException(
        400,
        SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }
}
