export type PilotFeedbackCategory =
  | 'bug'
  | 'ux_improvement'
  | 'new_feature'
  | 'business_rule_change';

export type PilotFeedbackSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR';

export type PilotFeedbackStatus = 'OPEN' | 'RESOLVED' | 'DEFERRED';

export type PilotFeedbackItem = {
  id: string;
  category: PilotFeedbackCategory;
  severity: PilotFeedbackSeverity;
  status: PilotFeedbackStatus;
  summary: string;
  reportedAt: string;
  reporter?: string;
};

export type PilotScope = {
  maxUsers: number;
  maxActiveServiceOrders: number;
  allowedArchetypes: string[];
  allowedUnitIds: string[];
  volumeCapPerWeek: number;
};

export type PilotObservationSnapshot = {
  collectedAt: string;
  httpErrorRate: number;
  httpLatencyP95Ms: number;
  dbErrorRate: number;
  dbPoolWaiting: number;
  workerPending: number;
  outboxFailed: number;
  serviceOrdersOverdue: number;
  allocationConflictSignals: number;
  billingAgingRecords: number;
  openSupportTickets: number;
};

export type PilotExitCriteria = {
  minObservationDays: number;
  maxHttpErrorRate: number;
  maxHttpLatencyP95Ms: number;
  maxOpenBlockers: number;
  maxCriticalOpen: number;
};

export type PilotPhase = 'ACTIVE' | 'EXIT_READY' | 'BLOCKED';

export type PilotStatusReport = {
  phase: PilotPhase;
  scope: PilotScope;
  observation: PilotObservationSnapshot;
  feedbackSummary: Record<PilotFeedbackCategory, number>;
  openBlockers: PilotFeedbackItem[];
  exitCriteria: PilotExitCriteria;
  exitCriteriaMet: string[];
  exitCriteriaFailed: string[];
  featureFlags: Record<string, boolean>;
};

export function blocksPilotExit(severity: PilotFeedbackSeverity): boolean {
  return severity === 'BLOCKER' || severity === 'CRITICAL';
}
