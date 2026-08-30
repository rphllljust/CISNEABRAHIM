export type SignOffDecision = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export type RpoRtoDecision = 'PENDING_APPROVAL' | 'DEFINED_BUT_NOT_APPROVED' | 'APPROVED';

export type PilotEngineeringReadiness = 'NOT_READY' | 'PILOT_READY_TO_START' | 'PILOT_STARTED';

export type ManualUatEngineeringReadiness =
  | 'NOT_READY'
  | 'UAT_READY_TO_EXECUTE'
  | 'UAT_SESSION_IN_PROGRESS'
  | 'UAT_COMPLETED';

export type PilotIncidentRecord = {
  id: string;
  recordedAt: string;
  summary: string;
  severity: 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR';
};

export type PilotCriticalErrorRecord = {
  id: string;
  recordedAt: string;
  summary: string;
  source: string;
};

export type PilotOperationalResultSnapshot = {
  recordedAt: string;
  httpErrorRate: number | null;
  openBlockers: number;
  notes: string | null;
};

export type PilotEvidencePhase =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'OBSERVATION'
  | 'EXIT_BLOCKED'
  | 'EXIT_READY'
  | 'FAILED'
  | 'ABORTED';

export type ManualUatUxStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PASSED'
  | 'PASSED_WITH_OBSERVATIONS'
  | 'FAILED';

export type ReleaseCandidateRef = {
  commitSha: string | null;
  artifactDigest: string | null;
  version: string | null;
};

export type BusinessSignOffEvidence = {
  decision: SignOffDecision;
  approvedBy: string | null;
  approvedAt: string | null;
  scope: string;
  environment: string;
  releaseCandidate: ReleaseCandidateRef;
  evidenceReference: string | null;
  decisionStatement: string;
  derivedScopeReferences: string[];
  notes: string | null;
};

export type RpoRtoEvidence = {
  decision: RpoRtoDecision;
  decisionId: 'DDP-016';
  proposalStatus?: 'READY_FOR_APPROVAL' | 'APPROVED' | 'REJECTED';
  proposalReference?: string;
  recommendedTierId?: 'conservative' | 'recommended' | 'high_availability';
  rpo: string | null;
  rto: string | null;
  backupStrategyReference: string;
  restoreStrategyReference: string;
  technicalBaselineReferences: string[];
  responsible: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  scope: string | null;
  notes: string | null;
};

export type PilotStartEventTemplate = {
  requiredFields: Array<'startedAt' | 'environment' | 'releaseCandidate' | 'authorizedBy'>;
  authorizedBy: string | null;
  environment: string | null;
};

export type PilotEvidence = {
  phase: PilotEvidencePhase;
  engineeringReadiness: PilotEngineeringReadiness;
  startedAt: string | null;
  observationEndsAt: string | null;
  minObservationDays: number;
  exitAuthorizedAt: string | null;
  exitAuthorizedBy: string | null;
  responsible: string | null;
  environment: string | null;
  releaseCandidate: ReleaseCandidateRef;
  incidents: PilotIncidentRecord[];
  criticalErrors: PilotCriticalErrorRecord[];
  operationalResults: PilotOperationalResultSnapshot[];
  evidenceReference: string;
  criteriaReferences: string[];
  flowCatalogReference: string;
  preFlightReference: string;
  startEvent: PilotStartEventTemplate;
  notes: string | null;
};

export type ManualUatUxEvidence = {
  status: ManualUatUxStatus;
  engineeringReadiness: ManualUatEngineeringReadiness;
  sessionId: string | null;
  performedBy: string | null;
  performedAt: string | null;
  environment: string | null;
  releaseCandidate: ReleaseCandidateRef;
  scenarios: string[];
  scenarioCatalogReference: string;
  sessionChecklistReference: string;
  automatedBaselineReferences: string[];
  result: string | null;
  issuesFound: string[];
  blockingIssues: string[];
  approval: string | null;
  evidenceReference: string;
  notes: string | null;
};

export type ReadinessEvidenceHistoryEntry = {
  recordedAt: string;
  actor: string;
  action: string;
  field: string;
  previousValue: string | null;
  newValue: string | null;
  releaseCandidate: ReleaseCandidateRef;
  notes: string | null;
};

export type ReadinessEvidenceRecord = {
  schemaVersion: 2;
  releaseCandidate: ReleaseCandidateRef;
  businessSignOff: BusinessSignOffEvidence;
  rpoRto: RpoRtoEvidence;
  pilot: PilotEvidence;
  manualUatUx: ManualUatUxEvidence;
  history: ReadinessEvidenceHistoryEntry[];
};

export type LoadedReadinessEvidence = {
  source: string;
  record: ReadinessEvidenceRecord;
  loadError: string | null;
};
