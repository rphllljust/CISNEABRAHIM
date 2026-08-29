import { describe, expect, it } from 'vitest';
import { buildListServiceRequestsQuery } from './service-requests-api';
import { SERVICE_REQUEST_STATUSES } from '../types/service-request.types';

describe('service-requests-api', () => {
  it('builds list query with filters', () => {
    const query = buildListServiceRequestsQuery({
      limit: 20,
      offset: 40,
      status: SERVICE_REQUEST_STATUSES.Submitted,
      unitId: 'unit-a',
    });
    expect(query).toContain('limit=20');
    expect(query).toContain('offset=40');
    expect(query).toContain('status=SUBMITTED');
    expect(query).toContain('unitId=unit-a');
  });
});
