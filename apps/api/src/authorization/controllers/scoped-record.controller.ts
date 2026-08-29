import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { AUTHZ_ERROR_CODES } from '../errors/authz-error-codes';
import { AuthzHttpException } from '../errors/authz-http.exception';
import { ScopedRecordAccessService } from '../services/scoped-record-access.service';

function parseLabel(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AuthzHttpException(
      HttpStatus.BAD_REQUEST,
      AUTHZ_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  const record = body as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || typeof record['label'] !== 'string') {
    throw new AuthzHttpException(
      HttpStatus.BAD_REQUEST,
      AUTHZ_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return record['label'];
}

@Controller('authz/scoped-records')
@UseGuards(JwtAuthGuard)
export class ScopedRecordController {
  constructor(private readonly scopedRecordAccess: ScopedRecordAccessService) {}

  @Get()
  list(@CurrentAuth() auth: AccessTokenClaims) {
    return this.scopedRecordAccess.list({ identityId: auth.sub, sessionId: auth.sid });
  }

  @Get(':recordId')
  getById(@CurrentAuth() auth: AccessTokenClaims, @Param('recordId') recordId: string) {
    return this.scopedRecordAccess.getById({ identityId: auth.sub, sessionId: auth.sid }, recordId);
  }

  @Patch(':recordId')
  @HttpCode(200)
  updateLabel(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('recordId') recordId: string,
    @Req() request: FastifyRequest,
  ) {
    const label = parseLabel(request.body);
    return this.scopedRecordAccess.updateLabel(
      { identityId: auth.sub, sessionId: auth.sid },
      recordId,
      label,
    );
  }
}
