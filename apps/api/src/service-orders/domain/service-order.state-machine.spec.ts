import { describe, expect, it } from 'vitest';
import { SERVICE_ORDER_STATUSES } from './service-order';
import {
  assertTransition,
  canTransition,
  isTerminalServiceOrderStatus,
  ServiceOrderStateError,
} from './service-order.state-machine';

describe('service-order.state-machine', () => {
  it('allows DRAFT to PREPARED via prepare', () => {
    expect(assertTransition(SERVICE_ORDER_STATUSES.Draft, 'prepare')).toBe(
      SERVICE_ORDER_STATUSES.Prepared,
    );
  });

  it('rejects direct DRAFT to RELEASED', () => {
    expect(canTransition(SERVICE_ORDER_STATUSES.Draft, 'release')).toBe(false);
    expect(() => assertTransition(SERVICE_ORDER_STATUSES.Draft, 'release')).toThrow(
      ServiceOrderStateError,
    );
  });

  it('allows PREPARED to RELEASED via release', () => {
    expect(assertTransition(SERVICE_ORDER_STATUSES.Prepared, 'release')).toBe(
      SERVICE_ORDER_STATUSES.Released,
    );
  });

  it('allows cancel from DRAFT, PREPARED and RELEASED', () => {
    for (const status of [
      SERVICE_ORDER_STATUSES.Draft,
      SERVICE_ORDER_STATUSES.Prepared,
      SERVICE_ORDER_STATUSES.Released,
    ]) {
      expect(assertTransition(status, 'cancel')).toBe(SERVICE_ORDER_STATUSES.Cancelled);
    }
  });

  it('marks COMPLETED and CANCELLED as terminal', () => {
    expect(isTerminalServiceOrderStatus(SERVICE_ORDER_STATUSES.Completed)).toBe(true);
    expect(isTerminalServiceOrderStatus(SERVICE_ORDER_STATUSES.Cancelled)).toBe(true);
    expect(isTerminalServiceOrderStatus(SERVICE_ORDER_STATUSES.Draft)).toBe(false);
  });

  it('allows execution lifecycle transitions', () => {
    expect(assertTransition(SERVICE_ORDER_STATUSES.Released, 'start')).toBe(
      SERVICE_ORDER_STATUSES.InExecution,
    );
    expect(assertTransition(SERVICE_ORDER_STATUSES.InExecution, 'pause')).toBe(
      SERVICE_ORDER_STATUSES.Paused,
    );
    expect(assertTransition(SERVICE_ORDER_STATUSES.Paused, 'resume')).toBe(
      SERVICE_ORDER_STATUSES.InExecution,
    );
    expect(assertTransition(SERVICE_ORDER_STATUSES.InExecution, 'complete')).toBe(
      SERVICE_ORDER_STATUSES.Completed,
    );
  });
});
