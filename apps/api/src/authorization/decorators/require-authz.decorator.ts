import { SetMetadata } from '@nestjs/common';
import type { AuthzAction } from '../types/authz-actions';
import type { AuthzResourceType } from '../types/authz-resources';

export const AUTHZ_REQUIREMENT_KEY = 'authz:requirement';

export type AuthzRequirement = {
  action: AuthzAction;
  resourceType: AuthzResourceType;
};

export const RequireAuthz = (requirement: AuthzRequirement) =>
  SetMetadata(AUTHZ_REQUIREMENT_KEY, requirement);
