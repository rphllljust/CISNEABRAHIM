import { describe, expect, it } from 'vitest';
import { buildPreFlightCatalog, listRequiredPreFlightConcerns, validatePreFlightCatalog } from './pilot-pre-flight';

describe('pilot pre-flight catalog', () => {
  it('covers all required technical concerns for pilot-critical flows', () => {
    const validation = validatePreFlightCatalog();
    expect(validation.missingConcerns).toEqual([]);
    expect(validation.ok).toBe(true);
    expect(listRequiredPreFlightConcerns()).toEqual(
      expect.arrayContaining(['concurrency', 'idempotency', 'recovery', 'negative_authorization']),
    );
  });

  it('references real integration specs for each concern', () => {
    const catalog = buildPreFlightCatalog();
    expect(catalog.tests.length).toBeGreaterThanOrEqual(10);
    for (const test of catalog.tests) {
      expect(test.specFile).toMatch(/\.spec\.ts$/);
      expect(test.testName.length).toBeGreaterThan(0);
    }
  });
});
