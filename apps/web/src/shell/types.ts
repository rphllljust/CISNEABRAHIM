export type ShellNavAccessCheck =
  | 'authz-probe'
  | 'client-list'
  | 'catalog-list'
  | 'asset-list'
  | 'request-list'
  | 'billing-list';

export type ShellNavItem = {
  id: string;
  label: string;
  path: string;
  capabilityId: string | null;
  accessCheck?: ShellNavAccessCheck;
};

export type NavAccessMap = Record<string, boolean>;
