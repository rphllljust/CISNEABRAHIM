import type { FaultHookId } from './fault-hook.ids';

export const FAULT_INJECTION_PORT = Symbol('FAULT_INJECTION_PORT');

export interface FaultInjectionPort {
  maybeThrow(hook: FaultHookId): Promise<void>;
}
