import { describe, expect, it } from 'vitest';
import {
  assertResourceTypeMatchesRequirement,
  ResourceCompatibilityError,
} from './resource-compatibility';

describe('resource-compatibility', () => {
  const snapshot = {
    requirements: {
      resources: [{ physicalResourceTypeCode: 'WATER_TRUCK', requirementLevel: 'REQUIRED' }],
      labor: [],
      execution: [],
    },
  };

  it('allows matching resource type', () => {
    expect(() =>
      assertResourceTypeMatchesRequirement(snapshot, 'WATER_TRUCK', 'WATER_TRUCK'),
    ).not.toThrow();
  });

  it('rejects mismatched allocation type', () => {
    expect(() =>
      assertResourceTypeMatchesRequirement(snapshot, 'WATER_TRUCK', 'MOTORCYCLE'),
    ).toThrow(ResourceCompatibilityError);
  });
});
