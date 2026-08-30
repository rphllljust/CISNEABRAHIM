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
  parseCreatePersonInput,
  parseDeactivatePersonInput,
  parseListPeopleQuery,
  parseStatusTransitionInput,
  parseUpdatePersonInput,
} from '../dto/person.dto';
import { PersonAccessService } from '../services/person-access.service';

@Controller('people')
@UseGuards(JwtAuthGuard)
export class PeopleController {
  constructor(private readonly personAccess: PersonAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    const input = parseCreatePersonInput(request.body);
    return this.personAccess.create({ identityId: auth.sub, sessionId: auth.sid }, input);
  }

  @Get()
  list(@CurrentAuth() auth: AccessTokenClaims, @Query() query: Record<string, unknown>) {
    const parsed = parseListPeopleQuery(query);
    return this.personAccess.list({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get(':personId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('personId') personId: string) {
    return this.personAccess.getById({ identityId: auth.sub, sessionId: auth.sid }, personId);
  }

  @Get(':personId/history')
  listHistory(@CurrentAuth() auth: AccessTokenClaims, @Param('personId') personId: string) {
    return this.personAccess.listHistory({ identityId: auth.sub, sessionId: auth.sid }, personId);
  }

  @Patch(':personId')
  update(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('personId') personId: string,
    @Req() request: FastifyRequest,
  ) {
    const input = parseUpdatePersonInput(request.body);
    return this.personAccess.update(
      { identityId: auth.sub, sessionId: auth.sid },
      personId,
      input,
    );
  }

  @Post(':personId/deactivate')
  @HttpCode(200)
  deactivate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('personId') personId: string,
    @Req() request: FastifyRequest,
  ) {
    const transition = parseStatusTransitionInput(request.body);
    const body = parseDeactivatePersonInput(request.body);
    return this.personAccess.deactivate(
      { identityId: auth.sub, sessionId: auth.sid },
      personId,
      transition.version,
      body.reason,
    );
  }

  @Post(':personId/activate')
  @HttpCode(200)
  activate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('personId') personId: string,
    @Req() request: FastifyRequest,
  ) {
    const transition = parseStatusTransitionInput(request.body);
    return this.personAccess.activate(
      { identityId: auth.sub, sessionId: auth.sid },
      personId,
      transition.version,
    );
  }
}
