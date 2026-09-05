import { describe, expect, it } from 'vitest';
import { assertCreateClientInput } from '../../../clients/domain/client.validation';
import type { IntegrationCustomerSnapshot } from '../domain/integration-models';
import { mapIntegrationCustomerToCreateClientInput } from '../mappers/customer-sync.mapper';

describe('customer-sync.mapper', () => {
  it('maps internal integration snapshot to domain create command', () => {
    const snapshot: IntegrationCustomerSnapshot = {
      externalErpId: 'EXT-12345',
      legalName: 'ACME Servicos Ltda',
      tradeName: 'ACME',
      taxId: '12.345.678/0001-90',
      primaryEmail: 'contato@acme.example',
      primaryPhone: '+5563999999999',
    };

    const command = mapIntegrationCustomerToCreateClientInput(snapshot);
    const normalizedTaxId = assertCreateClientInput(command);

    expect(normalizedTaxId).toBe('12345678000190');
    expect(command.externalErpId).toBe('EXT-12345');
  });
});
