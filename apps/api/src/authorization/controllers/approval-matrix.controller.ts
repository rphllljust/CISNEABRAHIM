import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import type {
  AddApprovalRulesInput,
  AssignApprovalRoleInput,
  CreateApprovalMatrixInput,
  EvaluateApprovalInput,
  PublishApprovalMatrixInput,
} from '../domain/approval-matrix.validation';
import { ApprovalMatrixAccessService } from '../services/approval-matrix-access.service';

@Controller('authz/approval-matrices')
@UseGuards(JwtAuthGuard)
export class ApprovalMatrixController {
  constructor(private readonly matrices: ApprovalMatrixAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Body() body: CreateApprovalMatrixInput) {
    return this.matrices.create({ identityId: auth.sub, sessionId: auth.sid }, body);
  }

  @Post('role-assignments')
  assignRole(@CurrentAuth() auth: AccessTokenClaims, @Body() body: AssignApprovalRoleInput) {
    return this.matrices.assignRole({ identityId: auth.sub, sessionId: auth.sid }, body);
  }

  @Post('decisions')
  evaluate(@CurrentAuth() auth: AccessTokenClaims, @Body() body: EvaluateApprovalInput) {
    return this.matrices.evaluate({ identityId: auth.sub, sessionId: auth.sid }, body);
  }

  @Post(':matrixId/rules')
  addRules(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('matrixId') matrixId: string,
    @Body() body: AddApprovalRulesInput,
  ) {
    return this.matrices.addRules({ identityId: auth.sub, sessionId: auth.sid }, matrixId, body);
  }

  @Post(':matrixId/publish')
  publish(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('matrixId') matrixId: string,
    @Body() body: PublishApprovalMatrixInput,
  ) {
    return this.matrices.publish({ identityId: auth.sub, sessionId: auth.sid }, matrixId, body);
  }

  @Post(':matrixId/amend')
  amend(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('matrixId') matrixId: string,
    @Body() body: PublishApprovalMatrixInput,
  ) {
    return this.matrices.amend({ identityId: auth.sub, sessionId: auth.sid }, matrixId, body);
  }

}
