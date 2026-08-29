import { describe, expect, it } from 'vitest';
import {
  assertExecutionRequirements,
  ExecutionRequirementValidationError,
} from './execution-requirement';

describe('execution requirements', () => {
  it('accepts required and optional typed requirements', () => {
    const result = assertExecutionRequirements([
      { requirementType: 'PHOTO', requirementLevel: 'REQUIRED' },
      { requirementType: 'DOCUMENT', requirementLevel: 'OPTIONAL' },
    ]);
    expect(result).toHaveLength(2);
  });

  it('accepts conditional requirements with supported typed conditions', () => {
    const result = assertExecutionRequirements([
      {
        requirementType: 'MILEAGE',
        requirementLevel: 'CONDITIONAL',
        config: {
          schemaVersion: 1,
          conditional: {
            conditionType: 'WHEN_MEASUREMENT_BASIS_IS',
            measurementBasis: 'TRIP',
          },
        },
      },
    ]);
    expect(result[0]?.config?.conditional?.conditionType).toBe('WHEN_MEASUREMENT_BASIS_IS');
  });

  it('rejects unknown condition types and forbidden executable config', () => {
    expect(() =>
      assertExecutionRequirements([
        {
          requirementType: 'LOCATION',
          requirementLevel: 'CONDITIONAL',
          config: {
            schemaVersion: 1,
            conditional: { conditionType: 'WHEN_CUSTOM_SCRIPT' as never },
          },
        },
      ]),
    ).toThrow(ExecutionRequirementValidationError);

    expect(() =>
      assertExecutionRequirements([
        {
          requirementType: 'OBSERVATION',
          requirementLevel: 'OPTIONAL',
          config: { schemaVersion: 1, expression: '1+1' } as never,
        },
      ]),
    ).toThrow(ExecutionRequirementValidationError);
  });
});
