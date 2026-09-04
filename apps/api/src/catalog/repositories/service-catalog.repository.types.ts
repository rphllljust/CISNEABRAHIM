import type {
  AllowedUnitInput,
  LaborRequirementInput,
  NormalizedExecutionRequirementInput,
  NormalizedPricingModelInput,
  ResourceRequirementInput,
} from '../domain/service-catalog.validation';

export type CreateDefinitionWithDraftInput = {
  code: string;
  name: string;
  categoryId: string;
  archetype: string;
  measurementMode: string;
  measurementBasis: string;
  description?: string;
  defaultUnitCode?: string;
  allowedUnits: AllowedUnitInput[];
  resourceRequirements: ResourceRequirementInput[];
  laborRequirements: LaborRequirementInput[];
  pricingModels: NormalizedPricingModelInput[];
  executionRequirements: NormalizedExecutionRequirementInput[];
  actorIdentityId: string;
  billingEntitlementPolicy?: string | null;
  requiresPurchaseOrder?: boolean | null;
};

export type CreateDraftVersionInput = {
  definitionId: string;
  name: string;
  categoryId: string;
  archetype: string;
  measurementMode: string;
  measurementBasis: string;
  description?: string;
  defaultUnitCode?: string;
  allowedUnits: AllowedUnitInput[];
  resourceRequirements: ResourceRequirementInput[];
  laborRequirements: LaborRequirementInput[];
  pricingModels: NormalizedPricingModelInput[];
  executionRequirements: NormalizedExecutionRequirementInput[];
  sourceVersion?: number;
  actorIdentityId: string;
  billingEntitlementPolicy?: string | null;
  requiresPurchaseOrder?: boolean | null;
};

export type UpdateDraftVersionInput = {
  definitionId: string;
  versionNumber: number;
  expectedLineageVersion: number;
  name: string;
  categoryId: string;
  archetype: string;
  measurementMode: string;
  measurementBasis: string;
  description?: string | null;
  defaultUnitCode?: string | null;
  allowedUnits: AllowedUnitInput[];
  resourceRequirements: ResourceRequirementInput[];
  laborRequirements: LaborRequirementInput[];
  pricingModels: NormalizedPricingModelInput[];
  executionRequirements: NormalizedExecutionRequirementInput[];
  actorIdentityId: string;
  billingEntitlementPolicy?: string | null;
  requiresPurchaseOrder?: boolean | null;
};
