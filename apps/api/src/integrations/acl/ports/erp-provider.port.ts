import type { IntegrationCustomerSnapshot } from '../domain/integration-models';

export type FetchErpCustomerInput = {
  externalCustomerId: string;
  signal?: AbortSignal;
};

export interface ERPProvider {
  readonly providerId: string;
  fetchCustomer(input: FetchErpCustomerInput): Promise<IntegrationCustomerSnapshot | null>;
}

export const ERP_PROVIDER = Symbol('ERP_PROVIDER');
