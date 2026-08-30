import { describe, expect, it } from 'vitest';
import {
  assertExecutionCompletePreconditions,
  assertExecutionStartPreconditions,
  collectSatisfiedEvidenceKinds,
  EXECUTION_EVIDENCE_KINDS,
  EXECUTION_ENTRY_TYPES,
  ServiceOrderExecutionError,
} from './service-order-execution';
import { SERVICE_ORDER_STATUSES } from './service-order';

const snapshot = {
  serviceCode: 'SVC',
  serviceName: 'Demo',
  allowedUnits: [{ unitCode: 'M3', isDefault: true, sortOrder: 0 }],
  requirements: {
    execution: [
      { evidenceKind: 'OBSERVATION', requirementLevel: 'REQUIRED', config: null, sortOrder: 0 },
      { evidenceKind: 'QUANTITY', requirementLevel: 'REQUIRED', config: null, sortOrder: 1 },
    ],
    resources: [
      {
        physicalResourceTypeCode: 'TRUCK',
        requirementLevel: 'REQUIRED',
        minQuantity: '1',
        sortOrder: 0,
      },
    ],
    labor: [],
  },
};

describe('service-order-execution domain', () => {
  it('rejects start when minimum resources are not planned', () => {
    expect(() =>
      assertExecutionStartPreconditions(
        {
          status: SERVICE_ORDER_STATUSES.Released,
          client_id: null,
          service_snapshot: snapshot,
        },
        [],
        null,
      ),
    ).toThrow(ServiceOrderExecutionError);
  });

  it('allows start when required resources are planned', () => {
    expect(() =>
      assertExecutionStartPreconditions(
        {
          status: SERVICE_ORDER_STATUSES.Released,
          client_id: null,
          service_snapshot: snapshot,
        },
        [
          {
            requirementKind: 'PHYSICAL_RESOURCE',
            resourceTypeCode: 'TRUCK',
            laborTypeCode: null,
            plannedQuantity: '1',
            status: 'PLANNED',
          },
        ],
        null,
      ),
    ).not.toThrow();
  });

  it('rejects completion when required evidence is missing', () => {
    expect(() =>
      assertExecutionCompletePreconditions(
        snapshot,
        collectSatisfiedEvidenceKinds({
          evidenceKinds: [EXECUTION_EVIDENCE_KINDS.Observation],
          entryEvidenceKinds: [],
          entryTypes: [],
        }),
      ),
    ).toThrow(ServiceOrderExecutionError);
  });

  it('accepts completion when required evidence kinds are satisfied', () => {
    expect(() =>
      assertExecutionCompletePreconditions(
        snapshot,
        collectSatisfiedEvidenceKinds({
          evidenceKinds: [EXECUTION_EVIDENCE_KINDS.Observation],
          entryEvidenceKinds: [],
          entryTypes: [EXECUTION_ENTRY_TYPES.Quantity],
        }),
      ),
    ).not.toThrow();
  });
});
