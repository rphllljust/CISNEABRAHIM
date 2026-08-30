import { describe, expect, it, vi } from 'vitest';
import { SearchRepository } from './search.repository';
import { SEARCH_ENTITY_TYPES } from '../domain/search-entity-type';

describe('SearchRepository parallel entity queries', () => {
  it('queries entity types concurrently using independent connections', async () => {
    const connectOrder: string[] = [];
    const releaseOrder: string[] = [];

    const makeClient = (label: string) => ({
      query: vi.fn(async (sql: string) => {
        if (sql.includes('COUNT')) {
          return { rows: [{ count: '1' }] };
        }
        return {
          rows: [
            {
              entity_id: `${label}-id`,
              title: label,
              subtitle: null,
              status: 'ACTIVE',
              occurred_at: new Date('2026-01-01T00:00:00.000Z'),
              entity_href: `/entities/${label}`,
              highlight: null,
            },
          ],
        };
      }),
      release: vi.fn(() => {
        releaseOrder.push(label);
      }),
    });

    const clients = {
      client: makeClient('client'),
      serviceOrder: makeClient('service-order'),
    };

    const pool = {
      connect: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        if (connectOrder.length === 0) {
          connectOrder.push('first');
          return clients.client;
        }
        connectOrder.push('second');
        return clients.serviceOrder;
      }),
    };

    const repository = new SearchRepository({
      getConnection: () => ({ pool }),
    } as never);

    const scopes = {
      clientScope: { clause: 'TRUE', params: [] },
      serviceRequestScope: null,
      proposalScope: null,
      purchaseOrderScope: null,
      serviceOrderScope: { clause: 'TRUE', params: [] },
      assetScope: null,
      documentScope: null,
      measurementScope: null,
      billingScope: null,
    };

    const result = await repository.search(
      { raw: 'synthetic', kind: 'text', term: 'synthetic', prefixTerm: 'synthetic' },
      scopes,
      [SEARCH_ENTITY_TYPES.Client, SEARCH_ENTITY_TYPES.ServiceOrder],
      10,
      0,
      {},
    );

    expect(pool.connect).toHaveBeenCalledTimes(2);
    expect(connectOrder).toEqual(['first', 'second']);
    expect(result.groups.size).toBe(2);
    expect(clients.client.release).toHaveBeenCalled();
    expect(clients.serviceOrder.release).toHaveBeenCalled();
  });
});
