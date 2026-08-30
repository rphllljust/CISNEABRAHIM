/** TEST_ONLY scaffold — not registered in production bootstrap. */
import { Injectable } from '@nestjs/common';
import type { IntegrationCustomerSnapshot } from '../../domain/integration-models';
import type { ERPProvider, FetchErpCustomerInput } from '../../ports/erp-provider.port';
import { executeProviderCall } from '../../resilience/provider-executor';
import { CircuitBreaker } from '../../resilience/circuit-breaker';
import { loadProviderExecutorConfig } from '../../resilience/provider-executor.config';
import { parseDygnusCustomerPayload } from './dygnus-customer.mapper';
import { mapDygnusHttpError, type DygnusHttpTransport } from './dygnus-error.mapper';

export type DygnusErpAdapterOptions = {
  apiKey: string;
  baseUrl: string;
  transport: DygnusHttpTransport;
};

@Injectable()
export class DygnusErpAdapter implements ERPProvider {
  readonly providerId = 'dygnus';
  private readonly circuitBreaker: CircuitBreaker;

  constructor(private readonly options: DygnusErpAdapterOptions) {
    const config = loadProviderExecutorConfig();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.circuitBreakerFailureThreshold,
      resetTimeoutMs: config.circuitBreakerResetTimeoutMs,
    });
  }

  async fetchCustomer(input: FetchErpCustomerInput): Promise<IntegrationCustomerSnapshot | null> {
    return executeProviderCall({
      operationName: 'DYGNUS_FETCH_CUSTOMER',
      signal: input.signal,
      circuitBreaker: this.circuitBreaker,
      fn: async (signal) => {
        const response = await this.options.transport.get(
          `/api/v1/clientes/${encodeURIComponent(input.externalCustomerId)}`,
          {
            signal,
            headers: {
              Authorization: `Bearer ${this.options.apiKey}`,
              Accept: 'application/json',
            },
          },
        );

        if (response.status === 404) {
          return null;
        }

        if (response.status !== 200) {
          throw mapDygnusHttpError(response);
        }

        return parseDygnusCustomerPayload(response.body);
      },
    });
  }
}

export function createDygnusErpAdapter(options: DygnusErpAdapterOptions): DygnusErpAdapter {
  return new DygnusErpAdapter(options);
}
