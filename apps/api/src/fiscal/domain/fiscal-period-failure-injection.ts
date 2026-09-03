import { Injectable } from '@nestjs/common';

export const FISCAL_PERIOD_FAILURE_INJECTION = Symbol('FISCAL_PERIOD_FAILURE_INJECTION');

export const FISCAL_PERIOD_FAILURE_STAGES = {
  AfterCloseChecks: 'after_close_checks',
  BeforeMarkClosed: 'before_mark_closed',
} as const;

export type FiscalPeriodFailureStage =
  (typeof FISCAL_PERIOD_FAILURE_STAGES)[keyof typeof FISCAL_PERIOD_FAILURE_STAGES];

@Injectable()
export class FiscalPeriodFailureInjection {
  stage: FiscalPeriodFailureStage | null = null;

  reset(): void {
    this.stage = null;
  }

  consume(stage: FiscalPeriodFailureStage): void {
    if (this.stage === stage) {
      this.stage = null;
      throw new Error('FISCAL_PERIOD_INJECTED_FAILURE');
    }
  }
}
