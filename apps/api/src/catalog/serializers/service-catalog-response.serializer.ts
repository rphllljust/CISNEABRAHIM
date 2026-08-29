import type { LineageStatus, VersionApiStatus, VersionDbStatus } from '../domain/service-catalog-status';
import { toVersionApiStatus } from '../domain/service-catalog-status';

export type ServiceDefinitionRow = {
  id: string;
  code: string;
  status: LineageStatus;
  version: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
  deactivation_reason: string | null;
};

export type ServiceDefinitionVersionRow = {
  id: string;
  service_definition_id: string;
  version: number;
  status: VersionDbStatus;
  category_id: string;
  archetype: string;
  name: string;
  description: string | null;
  default_unit_code: string | null;
  measurement_mode: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AllowedUnitRow = {
  unit_code: string;
  is_default: boolean;
  sort_order: number;
};

export type ResourceRequirementRow = {
  physical_resource_type_code: string;
  requirement_level: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';
  min_quantity: number;
  sort_order: number;
};

export type ServiceDefinitionSummary = ServiceDefinitionRow & {
  latest_published_version: number | null;
  current_draft_version: number | null;
};

export type ServiceDefinitionVersionDetail = ServiceDefinitionVersionRow & {
  code: string;
  allowed_units: AllowedUnitRow[];
  resource_requirements: ResourceRequirementRow[];
};

export type ServiceDefinitionResponse = {
  id: string;
  code: string;
  status: LineageStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
  deactivationReason: string | null;
  latestPublishedVersion: number | null;
  currentDraftVersion: number | null;
};

export type ServiceDefinitionVersionResponse = {
  id: string;
  serviceDefinitionId: string;
  code: string;
  version: number;
  status: VersionApiStatus;
  categoryId: string;
  archetype: string;
  name: string;
  description: string | null;
  defaultUnitCode: string | null;
  measurementMode: string;
  allowedUnits: Array<{ unitCode: string; isDefault: boolean; sortOrder: number }>;
  resourceRequirements: Array<{
    resourceTypeCode: string;
    requirementLevel: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';
    minQuantity: number;
    sortOrder: number;
  }>;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toServiceDefinitionResponse(row: ServiceDefinitionSummary): ServiceDefinitionResponse {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
    deactivationReason: row.deactivation_reason,
    latestPublishedVersion: row.latest_published_version,
    currentDraftVersion: row.current_draft_version,
  };
}

export function toServiceDefinitionVersionResponse(
  row: ServiceDefinitionVersionDetail,
): ServiceDefinitionVersionResponse {
  return {
    id: row.id,
    serviceDefinitionId: row.service_definition_id,
    code: row.code,
    version: row.version,
    status: toVersionApiStatus(row.status),
    categoryId: row.category_id,
    archetype: row.archetype,
    name: row.name,
    description: row.description,
    defaultUnitCode: row.default_unit_code,
    measurementMode: row.measurement_mode,
    allowedUnits: row.allowed_units.map((unit) => ({
      unitCode: unit.unit_code,
      isDefault: unit.is_default,
      sortOrder: unit.sort_order,
    })),
    resourceRequirements: row.resource_requirements.map((requirement) => ({
      resourceTypeCode: requirement.physical_resource_type_code,
      requirementLevel: requirement.requirement_level,
      minQuantity: requirement.min_quantity,
      sortOrder: requirement.sort_order,
    })),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
