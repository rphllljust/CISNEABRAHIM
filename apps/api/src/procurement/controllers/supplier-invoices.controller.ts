import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import type {
  CreateSupplierInvoiceInput,
  ValidateSupplierInvoiceInput,
} from '../domain/supplier-invoice.validation';
import { SupplierInvoiceAccessService } from '../services/supplier-invoice-access.service';

@Controller('supplier-invoices')
@UseGuards(JwtAuthGuard)
export class SupplierInvoicesController {
  constructor(private readonly invoices: SupplierInvoiceAccessService) {}

  @Post()
  @HttpCode(201)
  create(@CurrentAuth() auth: AccessTokenClaims, @Body() body: CreateSupplierInvoiceInput) {
    return this.invoices.create({ identityId: auth.sub, sessionId: auth.sid }, body);
  }

  @Get(':invoiceId')
  get(@CurrentAuth() auth: AccessTokenClaims, @Param('invoiceId') invoiceId: string) {
    return this.invoices.get({ identityId: auth.sub, sessionId: auth.sid }, invoiceId);
  }

  @Post(':invoiceId/validate')
  validate(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('invoiceId') invoiceId: string,
    @Body() body: ValidateSupplierInvoiceInput,
  ) {
    return this.invoices.validate({ identityId: auth.sub, sessionId: auth.sid }, invoiceId, body);
  }
}
