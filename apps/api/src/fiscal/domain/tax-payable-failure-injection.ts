import { Injectable } from '@nestjs/common';

export const TAX_PAYABLE_FAILURE_INJECTION = Symbol('TAX_PAYABLE_FAILURE_INJECTION');

export const TAX_PAYABLE_FAILURE_STAGES = {
  AfterObligationInsert: 'after_obligation_insert',
  BeforePayableOpen: 'before_payable_open',
} as const;

export type TaxPayableFailureStage =
  (typeof TAX_PAYABLE_FAILURE_STAGES)[keyof typeof TAX_PAYABLE_FAILURE_STAGES];

@Injectable()
export class TaxPayableFailureInjection {
  stage: TaxPayableFailureStage | null = null;

  reset(): void {
    this.stage = null;
  }

  consume(stage: TaxPayableFailureStage): void {
    if (this.stage === stage) {
      this.stage = null;
      throw new Error('TAX_PAYABLE_INJECTED_FAILURE');
    }
  }
}
