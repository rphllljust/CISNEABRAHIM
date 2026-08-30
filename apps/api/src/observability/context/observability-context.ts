import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export type ObservabilityContextState = {
  requestId: string;
  correlationId: string;
  operation?: string;
  actorId?: string;
};

const storage = new AsyncLocalStorage<ObservabilityContextState>();

export function createRequestId(): string {
  return randomUUID();
}

export function runWithObservabilityContext<T>(
  state: ObservabilityContextState,
  fn: () => T,
): T {
  return storage.run(state, fn);
}

export async function runWithObservabilityContextAsync<T>(
  state: ObservabilityContextState,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(state, fn);
}

export function getObservabilityContext(): ObservabilityContextState | undefined {
  return storage.getStore();
}

export function mergeObservabilityContext(
  patch: Partial<ObservabilityContextState>,
): ObservabilityContextState | undefined {
  const current = storage.getStore();
  if (!current) {
    return undefined;
  }
  return { ...current, ...patch };
}
