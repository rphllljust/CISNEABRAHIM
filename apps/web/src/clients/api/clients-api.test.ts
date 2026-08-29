import { describe, expect, it } from 'vitest';
import { buildListClientsQuery } from './clients-api';
import { CLIENT_STATUSES } from '../types/client.types';

describe('buildListClientsQuery', () => {
  it('builds pagination and status query params', () => {
    expect(buildListClientsQuery({ limit: 20, offset: 40, status: CLIENT_STATUSES.Active })).toBe(
      'limit=20&offset=40&status=ACTIVE',
    );
  });
});
