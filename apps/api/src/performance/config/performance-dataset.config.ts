export type PerformanceDatasetProfile = 'smoke' | 'full';

export type PerformanceDatasetVolumes = {
  clients: number;
  serviceOrders: number;
  executionEntries: number;
  documents: number;
  measurements: number;
  billingRecords: number;
};

export type PerformanceDatasetConfig = {
  profile: PerformanceDatasetProfile;
  unitId: string;
  volumes: PerformanceDatasetVolumes;
};

const SMOKE_VOLUMES: PerformanceDatasetVolumes = {
  clients: 25,
  serviceOrders: 60,
  executionEntries: 120,
  documents: 40,
  measurements: 20,
  billingRecords: 10,
};

const FULL_VOLUMES: PerformanceDatasetVolumes = {
  clients: 500,
  serviceOrders: 2_000,
  executionEntries: 5_000,
  documents: 800,
  measurements: 400,
  billingRecords: 200,
};

export function loadPerformanceDatasetConfig(
  env: NodeJS.ProcessEnv = process.env,
): PerformanceDatasetConfig {
  const profile: PerformanceDatasetProfile =
    env['PERF_DATASET_PROFILE'] === 'full' ? 'full' : 'smoke';
  return {
    profile,
    unitId: env['PERF_UNIT_ID'] ?? 'perf-unit-a',
    volumes: profile === 'full' ? FULL_VOLUMES : SMOKE_VOLUMES,
  };
}
