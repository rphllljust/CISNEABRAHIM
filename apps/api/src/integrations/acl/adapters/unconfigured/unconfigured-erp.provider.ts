import { Injectable } from '@nestjs/common';
import { throwIntegrationNotConfigured } from '../../domain/integration-not-configured';
import type { ERPProvider, FetchErpCustomerInput } from '../../ports/erp-provider.port';
import type { FiscalProvider, IssueFiscalDocumentInput } from '../../ports/fiscal-provider.port';
import type {
  DispatchNotificationInput,
  NotificationProvider,
} from '../../ports/notification-provider.port';

@Injectable()
export class UnconfiguredErpProvider implements ERPProvider {
  readonly providerId = 'unconfigured';

  async fetchCustomer(_input: FetchErpCustomerInput): Promise<never> {
    throwIntegrationNotConfigured('ERP');
  }
}

@Injectable()
export class UnconfiguredFiscalProvider implements FiscalProvider {
  readonly providerId = 'unconfigured';

  async issueDocument(_input: IssueFiscalDocumentInput): Promise<never> {
    throwIntegrationNotConfigured('FISCAL');
  }
}

@Injectable()
export class UnconfiguredNotificationProvider implements NotificationProvider {
  readonly providerId = 'unconfigured';

  async dispatch(_input: DispatchNotificationInput): Promise<never> {
    throwIntegrationNotConfigured('NOTIFICATION');
  }
}
