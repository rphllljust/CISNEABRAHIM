import type { ServiceOrderServiceSnapshot } from '../types/service-order.types';
import type { PlannedResource, ResourceAllocation } from '../types/resource-planning.types';

export type RequirementCoverageRow = {
  key: string;
  kind: 'PHYSICAL_RESOURCE' | 'LABOR';
  label: string;
  required: number;
  planned: number;
  allocated: number;
  pending: number;
  status: 'complete' | 'partial' | 'missing' | 'over';
};

function parseQuantity(value: string | null | undefined): number {
  const parsed = Number(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumPlanned(
  planned: PlannedResource[],
  matcher: (item: PlannedResource) => boolean,
): number {
  return planned.filter(matcher).reduce((sum, item) => sum + parseQuantity(item.plannedQuantity), 0);
}

function sumAllocated(
  allocations: ResourceAllocation[],
  resourceTypeCode: string,
): number {
  return allocations.filter(
    (item) => item.status === 'ACTIVE' && item.resourceTypeCode === resourceTypeCode,
  ).length;
}

export function buildRequirementCoverage(
  snapshot: ServiceOrderServiceSnapshot,
  planned: PlannedResource[],
  allocations: ResourceAllocation[],
): RequirementCoverageRow[] {
  const rows: RequirementCoverageRow[] = [];

  for (const resource of snapshot.requirements?.resources ?? []) {
    const code = resource.physicalResourceTypeCode;
    const required = parseQuantity(resource.minQuantity);
    const plannedQty = sumPlanned(
      planned,
      (item) => item.requirementKind === 'PHYSICAL_RESOURCE' && item.resourceTypeCode === code,
    );
    const allocatedQty = sumAllocated(allocations, code);
    const pending = Math.max(required - allocatedQty, 0);
    let status: RequirementCoverageRow['status'] = 'missing';
    if (allocatedQty >= required && required > 0) {
      status = 'complete';
    } else if (allocatedQty > 0) {
      status = 'partial';
    } else if (plannedQty > 0) {
      status = 'partial';
    }
    if (plannedQty > required && required > 0) {
      status = 'over';
    }

    rows.push({
      key: `resource:${code}`,
      kind: 'PHYSICAL_RESOURCE',
      label: code,
      required,
      planned: plannedQty,
      allocated: allocatedQty,
      pending,
      status,
    });
  }

  for (const labor of snapshot.requirements?.labor ?? []) {
    const code = labor.laborTypeCode;
    const required = parseQuantity(labor.minQuantity);
    const plannedQty = sumPlanned(
      planned,
      (item) => item.requirementKind === 'LABOR' && item.laborTypeCode === code,
    );
    const pending = Math.max(required - plannedQty, 0);
    let status: RequirementCoverageRow['status'] = 'missing';
    if (plannedQty >= required && required > 0) {
      status = 'complete';
    } else if (plannedQty > 0) {
      status = 'partial';
    }

    rows.push({
      key: `labor:${code}`,
      kind: 'LABOR',
      label: code,
      required,
      planned: plannedQty,
      allocated: 0,
      pending,
      status,
    });
  }

  return rows;
}
