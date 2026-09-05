export type ModuleRegistryStatus = 'available' | 'enabled' | 'not_released';

export type ModuleRegistrySummary = {
  moduleCode: string;
  name: string;
  description: string;
  domain: string;
  status: ModuleRegistryStatus;
  availability: boolean;
  reasons: string[];
  dependencies: string[];
};

export type ModuleRegistryDetail = ModuleRegistrySummary & {
  featureFlag: string | null;
  capabilities: string[];
  resources: string[];
  routes: string[];
};
