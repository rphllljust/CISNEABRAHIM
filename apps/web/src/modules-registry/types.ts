export type ModuleRegistryStatus = 'active' | 'disabled';

export type ModuleRegistryEntry = {
  moduleCode: string;
  name: string;
  capabilities: string[];
  resources: string[];
  availableFeatures: string[];
  routes: string[];
  status: ModuleRegistryStatus;
};
