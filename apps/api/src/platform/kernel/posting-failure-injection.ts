import { Injectable } from '@nestjs/common';

export const POSTING_FAILURE_INJECTION = Symbol('POSTING_FAILURE_INJECTION');

export const POSTING_FAILURE_STAGES = {
  AfterFiscalEvent: 'after_fiscal_event',
  AfterPayrollEvent: 'after_payroll_event',
  AfterFixedAssetMovement: 'after_fixed_asset_movement',
  BeforeJournal: 'before_journal',
  DuringPosting: 'during_posting',
} as const;

export type PostingFailureStage =
  (typeof POSTING_FAILURE_STAGES)[keyof typeof POSTING_FAILURE_STAGES];

@Injectable()
export class PostingFailureInjection {
  stage: PostingFailureStage | null = null;

  reset(): void {
    this.stage = null;
  }

  consume(stage: PostingFailureStage): void {
    if (this.stage === stage) {
      this.stage = null;
      throw new Error('ACCOUNTING_POSTING_INJECTED_FAILURE');
    }
  }
}
