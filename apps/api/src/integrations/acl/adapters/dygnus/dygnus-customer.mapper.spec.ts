import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../../domain/integration-error';
import {
  mapDygnusCustomerToIntegrationSnapshot,
  parseDygnusCustomerPayload,
} from './dygnus-customer.mapper';

describe('dygnus-customer.mapper', () => {
  it('maps Dygnus wire format to the internal integration model', () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'dygnus-customer.contract.json');
    const wirePayload = JSON.parse(readFileSync(fixturePath, 'utf8')) as unknown;

    const snapshot = parseDygnusCustomerPayload(wirePayload);

    expect(snapshot).toEqual({
      externalErpId: 'DYGNUS-12345',
      legalName: 'ACME Servicos Ltda',
      tradeName: 'ACME',
      taxId: '12345678000190',
      primaryEmail: 'contato@acme.example',
      primaryPhone: '+5563999999999',
    });
  });

  it('rejects malformed external payloads', () => {
    expect(() => parseDygnusCustomerPayload({ id_cliente: 'x' })).toThrow(
      IntegrationProviderError,
    );
    try {
      parseDygnusCustomerPayload(null);
    } catch (error) {
      expect(error).toBeInstanceOf(IntegrationProviderError);
      expect((error as IntegrationProviderError).errorClass).toBe(
        INTEGRATION_ERROR_CLASSES.InvalidPayload,
      );
    }
  });

  it('normalizes tax id digits only', () => {
    const snapshot = mapDygnusCustomerToIntegrationSnapshot({
      id_cliente: '1',
      razao_social: 'Test',
      cnpj: '11.222.333/0001-81',
    });
    expect(snapshot.taxId).toBe('11222333000181');
  });
});
