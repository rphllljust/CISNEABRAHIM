export type HmlSmokeCheck = {
  id: string;
  label: string;
  passed: boolean;
  statusCode: number | null;
  detail: string;
};

export type HmlSmokeResult = {
  status: 'PASS' | 'FAIL';
  startedAt: string;
  finishedAt: string;
  checks: HmlSmokeCheck[];
  error?: string;
};

export type HmlDeployResult = {
  status: 'PASS' | 'FAIL';
  steps: Array<{ id: string; label: string; passed: boolean; detail: string }>;
  smoke?: HmlSmokeResult;
};
