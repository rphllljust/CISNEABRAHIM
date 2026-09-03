import { Injectable } from '@nestjs/common';

export const EXPENSE_FAILURE_STAGES = {
  AfterExpenseApproval: 'after_expense_approval',
} as const;

export type ExpenseFailureStage = (typeof EXPENSE_FAILURE_STAGES)[keyof typeof EXPENSE_FAILURE_STAGES];

@Injectable()
export class ExpenseFailureInjection {
  stage: ExpenseFailureStage | null = null;

  reset(): void {
    this.stage = null;
  }

  consume(stage: ExpenseFailureStage): void {
    if (this.stage === stage) {
      this.stage = null;
      throw new Error('EXPENSE_INJECTED_FAILURE');
    }
  }
}
