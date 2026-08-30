import { describe, expect, it } from 'vitest';
import {
  createRequestId,
  getObservabilityContext,
  runWithObservabilityContext,
  runWithObservabilityContextAsync,
} from './observability-context';

describe('observability context', () => {
  it('propagates correlation and request identifiers within context', () => {
    runWithObservabilityContext(
      { requestId: 'req-1', correlationId: 'corr-1', operation: 'test.op' },
      () => {
        expect(getObservabilityContext()).toEqual({
          requestId: 'req-1',
          correlationId: 'corr-1',
          operation: 'test.op',
        });
      },
    );
    expect(getObservabilityContext()).toBeUndefined();
  });

  it('propagates context through async boundaries', async () => {
    await runWithObservabilityContextAsync(
      { requestId: 'req-2', correlationId: 'corr-2' },
      async () => {
        await Promise.resolve();
        expect(getObservabilityContext()?.correlationId).toBe('corr-2');
      },
    );
  });

  it('creates unique request ids', () => {
    expect(createRequestId()).not.toBe(createRequestId());
  });
});
