import { describe, expect, it } from 'vitest';
import { classifyJobError, PermanentJobError, TransientJobError } from './job-errors';

describe('classifyJobError', () => {
  it('classifies permanent and transient failures', () => {
    expect(classifyJobError(new PermanentJobError('x'))).toBe('PERMANENT');
    expect(classifyJobError(new TransientJobError('x'))).toBe('TRANSIENT');
    expect(classifyJobError(new Error('x'))).toBe('TRANSIENT');
  });
});
