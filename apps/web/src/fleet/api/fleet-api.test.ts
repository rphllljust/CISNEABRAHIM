import { describe, expect, it } from 'vitest';
import { VEHICLE_CLASSIFICATION } from '../../assets/types/physical-asset.types';
import { buildFleetSummaryQuery, buildListFleetVehiclesQuery } from './fleet-api';

describe('fleet-api', () => {
  it('always scopes list and summary queries to vehicles', () => {
    const listQuery = new URLSearchParams(
      buildListFleetVehiclesQuery({ limit: 20, offset: 0, q: 'ABC-1234' }),
    );
    expect(listQuery.get('classification')).toBe(VEHICLE_CLASSIFICATION);
    expect(listQuery.get('limit')).toBe('20');
    expect(listQuery.get('q')).toBe('ABC-1234');

    const summaryQuery = new URLSearchParams(buildFleetSummaryQuery());
    expect(summaryQuery.get('classification')).toBe(VEHICLE_CLASSIFICATION);
  });
});
