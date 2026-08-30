/** TEST_ONLY — not registered in production bootstrap. */
import { Injectable } from '@nestjs/common';
import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../../domain/integration-error';
import type { ERPProvider, FetchErpCustomerInput } from '../../ports/erp-provider.port';

@Injectable()
export class StubErpProvider implements ERPProvider {
  readonly providerId = 'stub-erp';

  async fetchCustomer(_input: FetchErpCustomerInput): Promise<null> {
    throw new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Permanent,
      'ERP_PROVIDER_NOT_CONFIGURED',
    );
  }
}
