import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertCreateClientInput } from '../../../clients/domain/client.validation';
import { mapIntegrationCustomerToCreateClientInput } from '../mappers/customer-sync.mapper';
import { parseDygnusCustomerPayload } from '../adapters/dygnus/dygnus-customer.mapper';

describe('customer-sync.mapper', () => {
  it('maps internal integration snapshot to domain create command', () => {
    const fixturePath = path.join(
      __dirname,
      '../adapters/dygnus/fixtures',
      'dygnus-customer.contract.json',
    );
    const snapshot = parseDygnusCustomerPayload(
      JSON.parse(readFileSync(fixturePath, 'utf8')) as unknown,
    );

    const command = mapIntegrationCustomerToCreateClientInput(snapshot);
    const normalizedTaxId = assertCreateClientInput(command);

    expect(normalizedTaxId).toBe('12345678000190');
    expect(command.externalErpId).toBe('DYGNUS-12345');
  });
});
