import { Injectable } from '@nestjs/common';

export const PROCUREMENT_FAILURE_INJECTION = Symbol('PROCUREMENT_FAILURE_INJECTION');

export const PROCUREMENT_FAILURE_STAGES = {
  AfterReceiptInsert: 'after_receipt_insert',
  AfterInvoiceValidation: 'after_invoice_validation',
} as const;

export type ProcurementFailureStage =
  (typeof PROCUREMENT_FAILURE_STAGES)[keyof typeof PROCUREMENT_FAILURE_STAGES];

@Injectable()
export class ProcurementFailureInjection {
  stage: ProcurementFailureStage | null = null;

  reset(): void {
    this.stage = null;
  }

  consume(stage: ProcurementFailureStage): void {
    if (this.stage === stage) {
      this.stage = null;
      throw new Error('PROCUREMENT_INJECTED_FAILURE');
    }
  }
}
