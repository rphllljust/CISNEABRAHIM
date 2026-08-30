import type { MigrationAssessment } from '../cd/cd-types';
import { assertSafeMigrationDeploy } from '../cd/migration-policy';

/**
 * Rollback window requires expand-phase migrations only.
 * Destructive downgrade is never assumed — old application N must survive schema left by N+1 deploy.
 */
export function assertExpandContractRollbackSafety(
  assessments: MigrationAssessment[],
  allowBreakingInDeploy: boolean,
): void {
  assertSafeMigrationDeploy(assessments, allowBreakingInDeploy);

  const breaking = assessments.filter((entry) => entry.risk === 'breaking-high-risk');
  if (breaking.length > 0 && !allowBreakingInDeploy) {
    throw new Error(
      'Rollback window requires expand/contract — breaking migrations would prevent safe return to N',
    );
  }
}

export function summarizeRollbackMigrationPolicy(assessments: MigrationAssessment[]): string {
  const breaking = assessments.filter((entry) => entry.risk === 'breaking-high-risk').length;
  const compatible = assessments.length - breaking;
  return `expand/contract: compatible=${compatible}; breaking=${breaking}; db_downgrade=false`;
}
