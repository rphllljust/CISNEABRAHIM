import { Injectable } from '@nestjs/common';
import type { FaultHookId } from '../platform/fault-injection/fault-hook.ids';
import type { FaultInjectionPort } from '../platform/fault-injection/fault-injection.port';

export class InjectedFaultError extends Error {
  constructor(public readonly hook: FaultHookId) {
    super(`FAULT_INJECTED:${hook}`);
    this.name = 'InjectedFaultError';
  }
}

@Injectable()
export class ConfigurableFaultInjectionPort implements FaultInjectionPort {
  private activeHook: FaultHookId | null = null;

  setActiveHook(hook: FaultHookId | null): void {
    this.activeHook = hook;
  }

  getActiveHook(): FaultHookId | null {
    return this.activeHook;
  }

  clear(): void {
    this.activeHook = null;
  }

  async maybeThrow(hook: FaultHookId): Promise<void> {
    if (this.activeHook === hook) {
      throw new InjectedFaultError(hook);
    }
  }
}
