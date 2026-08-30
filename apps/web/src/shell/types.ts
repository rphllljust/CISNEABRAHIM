export type ShellNavAccessCheck =
  | 'authz-probe'
  | 'client-list'
  | 'catalog-list'
  | 'asset-list'
  | 'request-list'
  | 'proposal-list'
  | 'purchase-order-list'
  | 'billing-list'
  | 'service-order-list'
  | 'people-list';

export type ShellNavItem = {
  id: string;
  label: string;
  path: string;
  capabilityId: string | null;
  accessCheck?: ShellNavAccessCheck;
};

export type ShellNavGroup = {
  id: string;
  label: string;
  items: ShellNavItem[];
};

export type NavAccessMap = Record<string, boolean>;

export type ShellBreadcrumbItem = {
  label: string;
  href?: string;
};
