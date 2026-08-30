import { describe, expect, it } from 'vitest';
import { SERVICE_ORDER_STATUSES } from './service-order';
import {
  SERVICE_ORDER_LIST_EVENTS,
  SERVICE_ORDER_LIST_FILTERS,
  buildServiceOrderListSqlParts,
  parseListServiceOrdersQuery,
} from './service-order-list.query';

describe('service-order-list.query', () => {
  it('parses pagination defaults and confirmed filters', () => {
    const parsed = parseListServiceOrdersQuery({
      limit: '10',
      offset: '5',
      status: SERVICE_ORDER_STATUSES.Released,
      filter: SERVICE_ORDER_LIST_FILTERS.Overdue,
      clientId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      unitId: 'unit-a',
      q: 'OS-2026',
      from: '2026-08-23',
      to: '2026-08-29',
      event: SERVICE_ORDER_LIST_EVENTS.Opened,
    });

    expect(parsed.limit).toBe(10);
    expect(parsed.offset).toBe(5);
    expect(parsed.status).toBe(SERVICE_ORDER_STATUSES.Released);
    expect(parsed.filter).toBe(SERVICE_ORDER_LIST_FILTERS.Overdue);
    expect(parsed.event).toBe(SERVICE_ORDER_LIST_EVENTS.Opened);
    expect(parsed.from?.toISOString()).toBe('2026-08-23T00:00:00.000Z');
    expect(parsed.toExclusive?.toISOString()).toBe('2026-08-30T00:00:00.000Z');
  });

  it('builds stable ordering and overdue deadline join', () => {
    const query = parseListServiceOrdersQuery({ filter: SERVICE_ORDER_LIST_FILTERS.Overdue });
    const parts = buildServiceOrderListSqlParts(query, 'unit_id = $1', ['unit-a']);

    expect(parts.orderBy).toBe('so.created_at DESC, so.id DESC');
    expect(parts.fromClause).toContain('INNER JOIN LATERAL');
    expect(parts.whereClause).toContain('deadlines.deadline <= NOW()');
    expect(parts.whereClause).toContain('so.unit_id = $1');
  });

  it('uses completed_at when filtering completed orders in period', () => {
    const query = parseListServiceOrdersQuery({
      status: SERVICE_ORDER_STATUSES.Completed,
      from: '2026-08-01',
      to: '2026-08-31',
      event: SERVICE_ORDER_LIST_EVENTS.Completed,
    });
    const parts = buildServiceOrderListSqlParts(query, 'TRUE', []);

    expect(parts.whereClause).toContain('so.completed_at >=');
    expect(parts.whereClause).toContain("so.status = $1::so.service_order_status");
  });
});
