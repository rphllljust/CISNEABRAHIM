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
  parseCloseContractInput,
  parseCreateContractInput,
  parseLinkContractDocumentInput,
  parseListContractsQuery,
  parseRowVersionBody,
  parseUpdateContractDraftInput,
} from '../dto/contracts.dto';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';
import { ContractsAccessService } from '../services/contracts-access.service';

@Controller('commercial/contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsAccess: ContractsAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    try {
      const input = parseCreateContractInput(request.body);
      return this.contractsAccess.create({ identityId: auth.sub, sessionId: auth.sid }, input);
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
    const parsed = parseListContractsQuery(query);
    return this.contractsAccess.list({ identityId: auth.sub, sessionId: auth.sid }, parsed);
  }

  @Get(':contractId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('contractId') contractId: string) {
    return this.contractsAccess.getById({ identityId: auth.sub, sessionId: auth.sid }, contractId);
  }

  @Patch(':contractId')
  updateDraft(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('contractId') contractId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseUpdateContractDraftInput(request.body);
      return this.contractsAccess.updateDraft(
        { identityId: auth.sub, sessionId: auth.sid },
        contractId,
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

  @Post(':contractId/activate')
  @HttpCode(200)
  activate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('contractId') contractId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseRowVersionBody(request.body);
      return this.contractsAccess.activate(
        { identityId: auth.sub, sessionId: auth.sid },
        contractId,
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

  @Post(':contractId/close')
  @HttpCode(200)
  close(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('contractId') contractId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseCloseContractInput(request.body);
      return this.contractsAccess.close(
        { identityId: auth.sub, sessionId: auth.sid },
        contractId,
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

  @Post(':contractId/documents')
  @HttpCode(200)
  linkDocument(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('contractId') contractId: string,
    @Req() request: FastifyRequest,
  ) {
    try {
      const input = parseLinkContractDocumentInput(request.body);
      return this.contractsAccess.linkDocument(
        { identityId: auth.sub, sessionId: auth.sid },
        contractId,
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
