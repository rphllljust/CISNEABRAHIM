export type ShellNavAccessCheck = 'authz-probe';

export type ShellNavItem = {
  id: string;
  label: string;
  path: string;
  capabilityId: string | null;
  accessCheck?: ShellNavAccessCheck;
};

export type NavAccessMap = Record<string, boolean>;
