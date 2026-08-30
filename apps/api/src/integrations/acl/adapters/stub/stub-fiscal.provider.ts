import { Injectable } from '@nestjs/common';
import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../../domain/integration-error';
import type { FiscalProvider, IssueFiscalDocumentInput } from '../../ports/fiscal-provider.port';

@Injectable()
export class StubFiscalProvider implements FiscalProvider {
  readonly providerId = 'stub-fiscal';

  issueDocument(_input: IssueFiscalDocumentInput): Promise<never> {
    throw new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Permanent,
      'FISCAL_PROVIDER_NOT_CONFIGURED',
    );
  }
}
