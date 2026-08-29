import type { ServiceOrderServiceSnapshot } from './service-order-snapshot';

export class ResourceCompatibilityError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function assertResourceTypeMatchesRequirement(
  serviceSnapshot: Record<string, unknown>,
  requiredTypeCode: string,
  allocatedTypeCode: string,
): void {
  if (requiredTypeCode !== allocatedTypeCode) {
    throw new ResourceCompatibilityError('RESOURCE_TYPE_MISMATCH');
  }

  const snapshot = serviceSnapshot as ServiceOrderServiceSnapshot;
  const resources = snapshot.requirements?.resources ?? [];
  const allowed = resources.some(
    (entry) => entry.physicalResourceTypeCode === requiredTypeCode,
  );
  if (!allowed) {
    throw new ResourceCompatibilityError('RESOURCE_TYPE_NOT_IN_SERVICE_REQUIREMENTS');
  }
}

export function assertLaborTypeInServiceRequirements(
  serviceSnapshot: Record<string, unknown>,
  laborTypeCode: string,
): void {
  const snapshot = serviceSnapshot as ServiceOrderServiceSnapshot;
  const labor = snapshot.requirements?.labor ?? [];
  const allowed = labor.some((entry) => entry.laborTypeCode === laborTypeCode);
  if (!allowed) {
    throw new ResourceCompatibilityError('LABOR_TYPE_NOT_IN_SERVICE_REQUIREMENTS');
  }
}
