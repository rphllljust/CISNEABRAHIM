import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { validateImportBankFileInput } from '../domain/bank-import.validation';
import {
  validateImportBankStatementInput,
  validateManualMatchInput,
} from '../domain/bank-reconciliation.validation';
import { BankReconciliationAccessService } from '../services/bank-reconciliation-access.service';

@Controller('finance/bank-reconciliation')
@UseGuards(JwtAuthGuard)
export class BankReconciliationController {
  constructor(private readonly reconciliation: BankReconciliationAccessService) {}

  @Post('statements')
  @HttpCode(200)
  importStatement(@CurrentAuth() auth: AccessTokenClaims, @Body() body: never) {
    return this.reconciliation.importStatement(
      { identityId: auth.sub, sessionId: auth.sid },
      validateImportBankStatementInput(body),
    );
  }

  @Post('statements/import')
  @HttpCode(200)
  importFile(@CurrentAuth() auth: AccessTokenClaims, @Body() body: never) {
    return this.reconciliation.importFile(
      { identityId: auth.sub, sessionId: auth.sid },
      validateImportBankFileInput(body),
    );
  }

  @Post('statements/:statementId/auto-match')
  @HttpCode(200)
  autoMatch(@CurrentAuth() auth: AccessTokenClaims, @Param('statementId') statementId: string) {
    return this.reconciliation.autoMatch({ identityId: auth.sub, sessionId: auth.sid }, statementId);
  }

  @Post('matches')
  @HttpCode(200)
  matchManual(@CurrentAuth() auth: AccessTokenClaims, @Body() body: never) {
    return this.reconciliation.matchManual(
      { identityId: auth.sub, sessionId: auth.sid },
      validateManualMatchInput(body),
    );
  }

  @Post('reconciliations/:reconciliationId/confirm')
  @HttpCode(200)
  confirm(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('reconciliationId') reconciliationId: string,
  ) {
    return this.reconciliation.confirm({ identityId: auth.sub, sessionId: auth.sid }, reconciliationId);
  }

  @Post('reconciliations/:reconciliationId/unreconcile')
  @HttpCode(200)
  unreconcile(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('reconciliationId') reconciliationId: string,
  ) {
    return this.reconciliation.unreconcile(
      { identityId: auth.sub, sessionId: auth.sid },
      reconciliationId,
    );
  }

  @Get('statements/:statementId')
  getStatement(@CurrentAuth() auth: AccessTokenClaims, @Param('statementId') statementId: string) {
    return this.reconciliation.getStatement({ identityId: auth.sub, sessionId: auth.sid }, statementId);
  }
}
