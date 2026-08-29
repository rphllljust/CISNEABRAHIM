import { AUTHZ_ERROR_CODES } from '../errors/authz-error-codes';
import { AuthzHttpException } from '../errors/authz-http.exception';
import { isAuthzAction } from '../types/authz-actions';
import { isAuthzResourceType } from '../types/authz-resources';
import type { AuthzAction } from '../types/authz-actions';
import type { AuthzResourceType } from '../types/authz-resources';
import { AUTHZ_SCOPES, ANCHORED_SCOPE_TYPES, isAuthzScopeType, type AuthzScopeType } from '../types/authz-scopes';

const ALLOWED_KEYS = new Set([
  'identityId',
  'action',
  'resourceType',
  'resourceId',
  'scopeType',
  'validUntil',
]);

export type CreateGrantInput = {
  identityId: string;
  action: AuthzAction;
  resourceType: AuthzResourceType;
  resourceId?: string;
  scopeType: AuthzScopeType;
  validUntil?: string;
};

function assertStrictObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid request body.');
  }
  const record = body as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!ALLOWED_KEYS.has(key)) {
      throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid request body.');
    }
  }
  return record;
}

export function parseCreateGrantInput(body: unknown): CreateGrantInput {
  const record = assertStrictObject(body);
  const identityId = record['identityId'];
  const action = record['action'];
  const resourceType = record['resourceType'];
  const resourceId = record['resourceId'];
  const scopeType = record['scopeType'];
  const validUntil = record['validUntil'];

  if (typeof identityId !== 'string' || identityId.length < 10) {
    throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid identityId.');
  }
  if (typeof action !== 'string' || !isAuthzAction(action)) {
    throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid action.');
  }
  if (typeof resourceType !== 'string' || !isAuthzResourceType(resourceType)) {
    throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid resourceType.');
  }
  if (resourceId !== undefined && typeof resourceId !== 'string') {
    throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid resourceId.');
  }
  if (typeof scopeType !== 'string' || !isAuthzScopeType(scopeType)) {
    throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid scopeType.');
  }
  if (scopeType === AUTHZ_SCOPES.Global && resourceId !== undefined) {
    throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid resourceId.');
  }
  if (ANCHORED_SCOPE_TYPES.has(scopeType) && (typeof resourceId !== 'string' || resourceId.length === 0)) {
    throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid resourceId.');
  }
  if (validUntil !== undefined && typeof validUntil !== 'string') {
    throw new AuthzHttpException(400, AUTHZ_ERROR_CODES.VALIDATION_FAILED, 'Invalid validUntil.');
  }

  return {
    identityId,
    action,
    resourceType,
    resourceId,
    scopeType,
    validUntil,
  };
}
