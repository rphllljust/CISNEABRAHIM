import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertCreateClientInput } from '../../../../clients/domain/client.validation';
import { INTEGRATION_ERROR_CLASSES } from '../../domain/integration-error';
import { mapIntegrationCustomerToCreateClientInput } from '../../mappers/customer-sync.mapper';
import { parseDygnusCustomerPayload } from './dygnus-customer.mapper';
import { createDygnusErpAdapter } from './dygnus-erp.adapter';
import type { DygnusHttpTransport } from './dygnus-error.mapper';

describe('dygnus ERP adapter contract', () => {
  it('translates Dygnus payload through internal model without leaking vendor DTO', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'dygnus-customer.contract.json');
    const wirePayload = JSON.parse(readFileSync(fixturePath, 'utf8')) as unknown;

    const snapshot = parseDygnusCustomerPayload(wirePayload);
    const command = mapIntegrationCustomerToCreateClientInput(snapshot);

    expect(command.externalErpId).toBe('DYGNUS-12345');
    expect(command.legalName).toBe('ACME Servicos Ltda');
    expect(command.contacts).toHaveLength(1);
    expect(() => assertCreateClientInput(command)).not.toThrow();
  });

  it('fetches and maps a customer through the ACL boundary', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'dygnus-customer.contract.json');
    const body = JSON.parse(readFileSync(fixturePath, 'utf8')) as unknown;

    const transport: DygnusHttpTransport = {
      get: async () => ({ status: 200, body }),
    };

    const adapter = createDygnusErpAdapter({
      apiKey: 'test-key',
      baseUrl: 'https://dygnus.example',
      transport,
    });

    const snapshot = await adapter.fetchCustomer({ externalCustomerId: 'DYGNUS-12345' });
    expect(snapshot?.externalErpId).toBe('DYGNUS-12345');
    expect(snapshot?.legalName).toBe('ACME Servicos Ltda');
  });

  it('returns null when Dygnus reports customer not found', async () => {
    const transport: DygnusHttpTransport = {
      get: async () => ({ status: 404, body: { message: 'not found' } }),
    };

    const adapter = createDygnusErpAdapter({
      apiKey: 'test-key',
      baseUrl: 'https://dygnus.example',
      transport,
    });

    await expect(adapter.fetchCustomer({ externalCustomerId: 'missing' })).resolves.toBeNull();
  });

  it('maps authentication failures without leaking vendor payload to callers', async () => {
    const transport: DygnusHttpTransport = {
      get: async () => ({
        status: 401,
        body: { error: 'invalid_token', detail: 'super-secret' },
      }),
    };

    const adapter = createDygnusErpAdapter({
      apiKey: 'bad-key',
      baseUrl: 'https://dygnus.example',
      transport,
    });

    await expect(adapter.fetchCustomer({ externalCustomerId: 'x' })).rejects.toMatchObject({
      errorClass: INTEGRATION_ERROR_CLASSES.Authentication,
      message: 'DYGNUS_AUTHENTICATION_FAILED',
    });
  });
});
