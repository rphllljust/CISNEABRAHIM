import { Injectable } from '@nestjs/common';
import { throwIntegrationNotConfigured } from '../../domain/integration-not-configured';
import type { ERPProvider, FetchErpCustomerInput } from '../../ports/erp-provider.port';

@Injectable()
export class UnconfiguredErpProvider implements ERPProvider {
  readonly providerId = 'unconfigured';

  async fetchCustomer(_input: FetchErpCustomerInput): Promise<never> {
    throwIntegrationNotConfigured('ERP');
  }
}
