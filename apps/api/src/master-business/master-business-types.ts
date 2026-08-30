import type { UatScenarioId } from '../uat/uat-types';

export type MasterBusinessArtifacts = {
  scenarioId: UatScenarioId;
  runSuffix: string;
  actorIdentityId: string;
  clientId: string;
  clientLegalNameAtCreate: string;
  clientTaxIdAtCreate: string;
  serviceDefinitionId: string;
  serviceDefinitionVersionId: string;
  publishedVersionNumber: number;
  publishedServiceCode: string;
  proposalId: string;
  proposalVersionNumber: number;
  proposalClientSnapshot: Record<string, unknown>;
  purchaseOrderId: string;
  poNumber: string;
  poClientSnapshot: Record<string, unknown>;
  serviceRequestId: string;
  serviceOrderId: string;
  measurementId: string;
  billingRecordId: string;
  billingDocumentId: string;
};

export type MasterBusinessScenarioResult = {
  scenarioId: UatScenarioId;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  error?: string;
  artifacts?: MasterBusinessArtifacts;
};
