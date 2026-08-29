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
  parseCreateClientInput,
  parseDeactivateClientInput,
  parseListClientsQuery,
  parseStatusTransitionInput,
  parseUpdateClientInput,
} from '../dto/client.dto';
import { ClientAccessService } from '../services/client-access.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientAccess: ClientAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    const input = parseCreateClientInput(request.body);
    return this.clientAccess.create({ identityId: auth.sub, sessionId: auth.sid }, input);
  }

  @Get()
  list(@CurrentAuth() auth: AccessTokenClaims, @Query() query: Record<string, unknown>) {
    const parsed = parseListClientsQuery(query);
    return this.clientAccess.list({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get(':clientId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('clientId') clientId: string) {
    return this.clientAccess.getById({ identityId: auth.sub, sessionId: auth.sid }, clientId);
  }

  @Patch(':clientId')
  update(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('clientId') clientId: string,
    @Req() request: FastifyRequest,
  ) {
    const input = parseUpdateClientInput(request.body);
    return this.clientAccess.update(
      { identityId: auth.sub, sessionId: auth.sid },
      clientId,
      input,
    );
  }

  @Post(':clientId/deactivate')
  @HttpCode(200)
  deactivate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('clientId') clientId: string,
    @Req() request: FastifyRequest,
  ) {
    const transition = parseStatusTransitionInput(request.body);
    const body = parseDeactivateClientInput(request.body);
    return this.clientAccess.deactivate(
      { identityId: auth.sub, sessionId: auth.sid },
      clientId,
      transition.version,
      body.reason,
    );
  }

  @Post(':clientId/activate')
  @HttpCode(200)
  activate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('clientId') clientId: string,
    @Req() request: FastifyRequest,
  ) {
    const transition = parseStatusTransitionInput(request.body);
    return this.clientAccess.activate(
      { identityId: auth.sub, sessionId: auth.sid },
      clientId,
      transition.version,
    );
  }
}
