import { describe, expect, it } from 'vitest';
import { SERVICE_ORDER_STATUSES, type ServiceOrderStatus } from './service-order';
import {
  assertReopenJustification,
  assertTransition,
  canTransition,
  isTerminalServiceOrderStatus,
  resolveReopenStatus,
  ServiceOrderStateError,
  type ServiceOrderTransition,
} from './service-order.state-machine';

const ALL_STATUSES = Object.values(SERVICE_ORDER_STATUSES);
const ALL_TRANSITIONS: ServiceOrderTransition[] = [
  'prepare',
  'release',
  'cancel',
  'start',
  'pause',
  'resume',
  'complete',
];

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
    expect(isTerminalServiceOrderStatus(SERVICE_ORDER_STATUSES.InExecution)).toBe(false);
    expect(isTerminalServiceOrderStatus(SERVICE_ORDER_STATUSES.Paused)).toBe(false);
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

  it('reopens cancelled OS to the previous status with justification', () => {
    expect(
      resolveReopenStatus({
        currentStatus: SERVICE_ORDER_STATUSES.Cancelled,
        statusBeforeCancel: SERVICE_ORDER_STATUSES.Released,
      }),
    ).toBe(SERVICE_ORDER_STATUSES.Released);
    expect(assertReopenJustification('Correção operacional autorizada')).toBe(
      'Correção operacional autorizada',
    );
    expect(() => assertReopenJustification('   ')).toThrow(ServiceOrderStateError);
  });

  it('reopens a completed OS to IN_EXECUTION requiring justification (service test)', () => {
    expect(
      resolveReopenStatus({
        currentStatus: SERVICE_ORDER_STATUSES.Completed,
        statusBeforeCancel: null,
      }),
    ).toBe(SERVICE_ORDER_STATUSES.InExecution);
    expect(() =>
      resolveReopenStatus({
        currentStatus: SERVICE_ORDER_STATUSES.Cancelled,
        statusBeforeCancel: null,
      }),
    ).toThrow(ServiceOrderStateError);
    expect(assertReopenJustification('Retrabalho autorizado após conclusão')).toBe(
      'Retrabalho autorizado após conclusão',
    );
    expect(() => assertReopenJustification('')).toThrow(ServiceOrderStateError);
  });

  it('rejects invalid transitions with INVALID_STATE_TRANSITION', () => {
    const invalidPairs: Array<[ServiceOrderStatus, ServiceOrderTransition]> = [
      [SERVICE_ORDER_STATUSES.Draft, 'release'],
      [SERVICE_ORDER_STATUSES.Draft, 'start'],
      [SERVICE_ORDER_STATUSES.Draft, 'pause'],
      [SERVICE_ORDER_STATUSES.Draft, 'complete'],
      [SERVICE_ORDER_STATUSES.Prepared, 'prepare'],
      [SERVICE_ORDER_STATUSES.Prepared, 'start'],
      [SERVICE_ORDER_STATUSES.Prepared, 'complete'],
      [SERVICE_ORDER_STATUSES.Released, 'prepare'],
      [SERVICE_ORDER_STATUSES.Released, 'release'],
      [SERVICE_ORDER_STATUSES.Released, 'pause'],
      [SERVICE_ORDER_STATUSES.Released, 'complete'],
      [SERVICE_ORDER_STATUSES.InExecution, 'prepare'],
      [SERVICE_ORDER_STATUSES.InExecution, 'release'],
      [SERVICE_ORDER_STATUSES.InExecution, 'cancel'],
      [SERVICE_ORDER_STATUSES.InExecution, 'start'],
      [SERVICE_ORDER_STATUSES.InExecution, 'resume'],
      [SERVICE_ORDER_STATUSES.Paused, 'prepare'],
      [SERVICE_ORDER_STATUSES.Paused, 'pause'],
      [SERVICE_ORDER_STATUSES.Paused, 'complete'],
      [SERVICE_ORDER_STATUSES.Paused, 'cancel'],
      [SERVICE_ORDER_STATUSES.Completed, 'prepare'],
      [SERVICE_ORDER_STATUSES.Completed, 'cancel'],
      [SERVICE_ORDER_STATUSES.Completed, 'start'],
      [SERVICE_ORDER_STATUSES.Cancelled, 'prepare'],
      [SERVICE_ORDER_STATUSES.Cancelled, 'release'],
      [SERVICE_ORDER_STATUSES.Cancelled, 'start'],
    ];

    for (const [status, transition] of invalidPairs) {
      expect(canTransition(status, transition)).toBe(false);
      expect(() => assertTransition(status, transition)).toThrow(ServiceOrderStateError);
      expect(() => assertTransition(status, transition)).toThrow('INVALID_STATE_TRANSITION');
    }
  });

  it('blocks all transitions from terminal states', () => {
    for (const status of [SERVICE_ORDER_STATUSES.Completed, SERVICE_ORDER_STATUSES.Cancelled]) {
      for (const transition of ALL_TRANSITIONS) {
        expect(canTransition(status, transition)).toBe(false);
        expect(() => assertTransition(status, transition)).toThrow(ServiceOrderStateError);
      }
    }
  });

  it('defines a complete transition matrix without gaps', () => {
    for (const status of ALL_STATUSES) {
      for (const transition of ALL_TRANSITIONS) {
        const allowed = canTransition(status, transition);
        if (allowed) {
          expect(() => assertTransition(status, transition)).not.toThrow();
        } else {
          expect(() => assertTransition(status, transition)).toThrow(ServiceOrderStateError);
        }
      }
    }
  });
});
