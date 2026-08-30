import { Global, Module } from '@nestjs/common';
import { FAULT_INJECTION_PORT } from './fault-injection.port';
import { NoopFaultInjectionPort } from './noop-fault-injection.port';

@Global()
@Module({
  providers: [{ provide: FAULT_INJECTION_PORT, useClass: NoopFaultInjectionPort }],
  exports: [FAULT_INJECTION_PORT],
})
export class FaultInjectionModule {}
