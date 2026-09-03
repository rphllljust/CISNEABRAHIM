import { describe, expect, it } from 'vitest';
import { RENTAL_SERVICE_ARCHETYPE } from './rentals-api';

describe('rentals-api', () => {
  it('scopes rental list to RENTAL archetype', () => {
    expect(RENTAL_SERVICE_ARCHETYPE).toBe('RENTAL');
  });
});