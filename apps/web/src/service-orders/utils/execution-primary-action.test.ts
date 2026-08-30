import { describe, expect, it } from 'vitest';
import { SERVICE_ORDER_STATUSES } from '../types/service-order.types';
import { resolvePrimaryAction } from './execution-primary-action';

describe('execution-primary-action', () => {
  it('returns start for released orders', () => {
    const action = resolvePrimaryAction({
      status: SERVICE_ORDER_STATUSES.Released,
      requirementsComplete: false,
      canMutate: true,
    });
    expect(action.kind).toBe('start');
    expect(action.label).toMatch(/começar/i);
  });

  it('returns record while requirements are pending', () => {
    const action = resolvePrimaryAction({
      status: SERVICE_ORDER_STATUSES.InExecution,
      requirementsComplete: false,
      canMutate: true,
    });
    expect(action.kind).toBe('record');
  });

  it('returns complete when requirements are satisfied', () => {
    const action = resolvePrimaryAction({
      status: SERVICE_ORDER_STATUSES.InExecution,
      requirementsComplete: true,
      canMutate: true,
    });
    expect(action.kind).toBe('complete');
  });

  it('returns resume for paused orders', () => {
    const action = resolvePrimaryAction({
      status: SERVICE_ORDER_STATUSES.Paused,
      requirementsComplete: false,
      canMutate: true,
    });
    expect(action.kind).toBe('resume');
  });
});
