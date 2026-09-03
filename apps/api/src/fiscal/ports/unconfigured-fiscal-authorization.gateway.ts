import { Injectable } from '@nestjs/common';
import { FiscalError } from '../domain/fiscal-document';
import type {
  FiscalAuthorizationGateway,
  FiscalGatewaySubmitInput,
  FiscalGatewaySubmitResult,
} from './fiscal-authorization-gateway.port';

@Injectable()
export class UnconfiguredFiscalAuthorizationGateway implements FiscalAuthorizationGateway {
  readonly gatewayId = 'unconfigured-fiscal-authorization';

  submit(_input: FiscalGatewaySubmitInput): Promise<FiscalGatewaySubmitResult> {
    throw new FiscalError('FISCAL_GATEWAY_NOT_CONFIGURED');
  }
}
