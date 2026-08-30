import { Injectable } from '@nestjs/common';
import type { FaultHookId } from './fault-hook.ids';
import type { FaultInjectionPort } from './fault-injection.port';

@Injectable()
export class NoopFaultInjectionPort implements FaultInjectionPort {
  async maybeThrow(_hook: FaultHookId): Promise<void> {
    return;
  }
}
