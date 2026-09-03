import { describe, expect, it } from 'vitest';
import { TRANSPORT_SERVICE_ARCHETYPE } from './transport-api';

describe('transport-api', () => {
  it('scopes transport list to TRANSPORT archetype', () => {
    expect(TRANSPORT_SERVICE_ARCHETYPE).toBe('TRANSPORT');
  });
});
