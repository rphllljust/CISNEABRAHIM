import type { FaultHookId } from './fault-hook.ids';
import type { FaultInjectionPort } from './fault-injection.port';

export async function maybeInjectFault(
  port: FaultInjectionPort | undefined,
  hook: FaultHookId,
): Promise<void> {
  await port?.maybeThrow(hook);
}
