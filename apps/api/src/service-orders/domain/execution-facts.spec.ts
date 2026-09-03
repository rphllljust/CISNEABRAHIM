import { describe, expect, it } from 'vitest';
import { EXECUTION_ENTRY_TYPES } from './service-order-execution';
import {
  buildExecutionFactsComparison,
  buildExecutionPeriodFacts,
  buildExecutionQuantityFacts,
  buildExecutionResourceFacts,
  sumActualQuantitiesByUnit,
} from './execution-facts';

const snapshot = {
  serviceDefinitionId: 'svc-def-id',
  serviceDefinitionVersionId: 'svc-def-version-id',
  serviceCode: 'SVC',
  serviceName: 'Demo',
  catalogVersion: 1,
  versionStatus: 'PUBLISHED',
  archetype: 'CIVIL_WORK',
  measurementModel: {
    mode: 'BY_EVENT',
    basis: 'GLOBAL_COMPLETION',
    defaultUnitCode: 'SERVICE',
  },
  allowedUnits: [{ unitCode: 'SERVICE', isDefault: true, sortOrder: 0 }],
  requirements: {
    execution: [],
    resources: [
      {
        physicalResourceTypeCode: 'WATER_TRUCK',
        requirementLevel: 'REQUIRED',
        minQuantity: '1',
        sortOrder: 0,
      },
    ],
    labor: [],
  },
  snapshottedAt: '2026-06-01T00:00:00.000Z',
};

describe('execution-facts', () => {
  it('sums actual quantities without mutating source entries', () => {
    const entries = [
      {
        entryType: EXECUTION_ENTRY_TYPES.Quantity,
        quantityValue: '1',
        quantityUnitCode: 'SERVICE',
      },
      {
        entryType: EXECUTION_ENTRY_TYPES.Quantity,
        quantityValue: '2',
        quantityUnitCode: 'SERVICE',
      },
    ];
    const totals = sumActualQuantitiesByUnit(entries);
    expect(totals.get('SERVICE')).toBe(3);
    expect(entries[0]?.quantityValue).toBe('1');
  });

  it('differentiates planned quantity from actual recorded quantity', () => {
    const rows = buildExecutionQuantityFacts(
      snapshot,
      [
        {
          id: 'planned-1',
          requirementKind: 'PHYSICAL_RESOURCE',
          resourceTypeCode: 'WATER_TRUCK',
          laborTypeCode: null,
          plannedQuantity: '2',
          operationalStart: null,
          operationalEnd: null,
          status: 'PLANNED',
        },
      ],
      [
        {
          entryType: EXECUTION_ENTRY_TYPES.Quantity,
          quantityValue: '1',
          quantityUnitCode: 'SERVICE',
        },
      ],
    );
    expect(rows).toEqual([
      {
        unitCode: 'SERVICE',
        plannedQuantity: '1',
        actualQuantity: '1',
      },
    ]);
  });

  it('builds resource facts with allocation coverage separate from planned quantity', () => {
    const rows = buildExecutionResourceFacts(
      [
        {
          id: 'planned-1',
          requirementKind: 'PHYSICAL_RESOURCE',
          resourceTypeCode: 'WATER_TRUCK',
          laborTypeCode: null,
          plannedQuantity: '1',
          operationalStart: '2026-06-01T08:00:00.000Z',
          operationalEnd: '2026-06-01T18:00:00.000Z',
          status: 'PLANNED',
        },
      ],
      [
        {
          plannedResourceId: 'planned-1',
          resourceTypeCode: 'WATER_TRUCK',
          operationalStart: '2026-06-01T08:00:00.000Z',
          operationalEnd: '2026-06-01T12:00:00.000Z',
          status: 'ACTIVE',
        },
      ],
    );
    expect(rows[0]).toMatchObject({
      code: 'WATER_TRUCK',
      plannedQuantity: '1',
      allocatedActiveCount: 1,
    });
  });

  it('keeps execution lifecycle period separate from planned and allocated windows', () => {
    const periods = buildExecutionPeriodFacts({
      plannedResources: [
        {
          id: 'planned-1',
          requirementKind: 'PHYSICAL_RESOURCE',
          resourceTypeCode: 'WATER_TRUCK',
          laborTypeCode: null,
          plannedQuantity: '1',
          operationalStart: '2026-06-01T08:00:00.000Z',
          operationalEnd: '2026-06-01T18:00:00.000Z',
          status: 'PLANNED',
        },
      ],
      allocations: [
        {
          plannedResourceId: 'planned-1',
          resourceTypeCode: 'WATER_TRUCK',
          operationalStart: '2026-06-01T08:00:00.000Z',
          operationalEnd: '2026-06-01T12:00:00.000Z',
          status: 'ACTIVE',
        },
      ],
      startedAt: '2026-06-01T09:00:00.000Z',
      completedAt: '2026-06-01T17:00:00.000Z',
      pausedAt: null,
    });
    expect(periods.map((item) => item.source)).toEqual([
      'PLANNED_RESOURCE',
      'ALLOCATION',
      'EXECUTION_LIFECYCLE',
    ]);
  });

  it('builds consolidated comparison without erasing occurrence facts', () => {
    const comparison = buildExecutionFactsComparison({
      snapshot,
      plannedResources: [],
      allocations: [],
      entries: [
        {
          entryType: EXECUTION_ENTRY_TYPES.Observation,
          quantityValue: null,
          quantityUnitCode: null,
        },
      ],
      occurrenceCount: 2,
      startedAt: '2026-06-01T09:00:00.000Z',
      completedAt: null,
      pausedAt: null,
    });
    expect(comparison.entryCount).toBe(1);
    expect(comparison.occurrenceCount).toBe(2);
  });
});