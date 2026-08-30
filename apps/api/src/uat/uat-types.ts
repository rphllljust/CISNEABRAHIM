export type UatDefectSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR';

export type UatDefectStatus = 'OPEN' | 'FIXED' | 'WAIVED';

export type UatDefect = {
  id: string;
  severity: UatDefectSeverity;
  status: UatDefectStatus;
  scenarioId?: string;
  summary: string;
  regressionTest?: string;
};

export type UatScenarioId = 'locacao' | 'transporte' | 'obra_composto';

export type UatScenarioResult = {
  scenarioId: UatScenarioId;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  error?: string;
  serviceOrderId?: string;
  billingDocumentId?: string;
};

export type UatProfileId = 'control_admin' | 'executor' | 'finance';

export type UatProfileCheck = {
  profileId: UatProfileId;
  action: string;
  expected: 'ALLOW' | 'DENY';
  actual: 'ALLOW' | 'DENY';
  passed: boolean;
};

export type UatUxCheck = {
  id: string;
  viewport: 'mobile' | 'tablet' | 'desktop';
  passed: boolean;
  detail: string;
};

export type UatVerdict = {
  status: 'APPROVED' | 'REJECTED';
  scenarioResults: UatScenarioResult[];
  profileChecks: UatProfileCheck[];
  openBlockers: UatDefect[];
  goLiveBlockers: string[];
  evaluatedAt: string;
};

export function blocksGoLive(severity: UatDefectSeverity): boolean {
  return severity === 'BLOCKER' || severity === 'CRITICAL';
}
