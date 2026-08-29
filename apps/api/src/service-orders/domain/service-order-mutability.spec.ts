import { describe, expect, it } from 'vitest';
import { SERVICE_ORDER_STATUSES } from './service-order';
import { assertMutableFields, ServiceOrderMutabilityError } from './service-order-mutability';

describe('service-order-mutability', () => {
  it('allows all fields in DRAFT', () => {
    expect(() =>
      assertMutableFields(SERVICE_ORDER_STATUSES.Draft, ['clientId', 'serviceDefinitionId']),
    ).not.toThrow();
  });

  it('blocks critical fields in PREPARED', () => {
    expect(() => assertMutableFields(SERVICE_ORDER_STATUSES.Prepared, ['clientId'])).toThrow(
      ServiceOrderMutabilityError,
    );
    try {
      assertMutableFields(SERVICE_ORDER_STATUSES.Prepared, ['clientId']);
    } catch (error) {
      expect((error as ServiceOrderMutabilityError).code).toBe('IMMUTABLE_CRITICAL_FIELD');
    }
  });

  it('allows operational fields in PREPARED', () => {
    expect(() =>
      assertMutableFields(SERVICE_ORDER_STATUSES.Prepared, ['description', 'priority']),
    ).not.toThrow();
  });

  it('blocks any update in RELEASED', () => {
    expect(() => assertMutableFields(SERVICE_ORDER_STATUSES.Released, ['description'])).toThrow(
      ServiceOrderMutabilityError,
    );
  });
});
