import {
  VEHICLE_CLASSIFICATION,
  type PhysicalAsset,
  type PhysicalResourceTypeOption,
  type CreatePhysicalAssetPayload,
} from '../types/physical-asset.types';

export type AssetFormValues = {
  assetCode: string;
  resourceTypeId: string;
  name: string;
  unitId: string;
  plate: string;
  chassis: string;
  model: string;
};

export type AssetFormFieldErrors = Partial<Record<keyof AssetFormValues | 'vehicle', string>>;

export function isVehicleResourceType(
  resourceTypeId: string,
  resourceTypes: PhysicalResourceTypeOption[],
): boolean {
  const selected = resourceTypes.find((type) => type.id === resourceTypeId);
  return selected?.classification === VEHICLE_CLASSIFICATION;
}

export function validateAssetForm(
  values: AssetFormValues,
  resourceTypes: PhysicalResourceTypeOption[],
  mode: 'create' | 'edit',
): AssetFormFieldErrors {
  const errors: AssetFormFieldErrors = {};

  if (mode === 'create') {
    if (!values.assetCode.trim()) {
      errors.assetCode = 'Informe o código do ativo.';
    }
    if (!values.resourceTypeId) {
      errors.resourceTypeId = 'Selecione o tipo de recurso.';
    }
    if (!values.unitId.trim()) {
      errors.unitId = 'Informe a unidade operacional.';
    }
  }

  if (!values.name.trim()) {
    errors.name = 'Informe o nome ou descrição do ativo.';
  }

  if (isVehicleResourceType(values.resourceTypeId, resourceTypes)) {
    if (!values.plate.trim()) {
      errors.plate = 'Veículos exigem placa.';
    }
  }

  return errors;
}

export function buildCreatePayload(
  values: AssetFormValues,
  resourceTypes: PhysicalResourceTypeOption[],
): CreatePhysicalAssetPayload {
  const payload = {
    assetCode: values.assetCode.trim().toUpperCase(),
    resourceTypeId: values.resourceTypeId,
    name: values.name.trim(),
    unitId: values.unitId.trim(),
  };

  if (!isVehicleResourceType(values.resourceTypeId, resourceTypes)) {
    return payload;
  }

  return {
    ...payload,
    vehicle: {
      plate: values.plate.trim(),
      chassis: values.chassis.trim() || undefined,
      model: values.model.trim() || undefined,
    },
  };
}

export function buildUpdatePayload(
  version: number,
  values: AssetFormValues,
  resourceTypes: PhysicalResourceTypeOption[],
) {
  const payload: {
    version: number;
    name: string;
    vehicle?: { plate: string; chassis?: string; model?: string };
  } = {
    version,
    name: values.name.trim(),
  };

  if (isVehicleResourceType(values.resourceTypeId, resourceTypes)) {
    payload.vehicle = {
      plate: values.plate.trim(),
      chassis: values.chassis.trim() || undefined,
      model: values.model.trim() || undefined,
    };
  }

  return payload;
}

export function assetToFormValues(asset: PhysicalAsset): AssetFormValues {
  return {
    assetCode: asset.assetCode,
    resourceTypeId: asset.resourceTypeId,
    name: asset.name,
    unitId: asset.unitId,
    plate: asset.vehicle?.plate ?? '',
    chassis: asset.vehicle?.chassis ?? '',
    model: asset.vehicle?.model ?? '',
  };
}

export function filterAssetsBySearch<T extends { assetCode: string; name: string; vehicle: { plate: string } | null }>(
  items: T[],
  search: string,
): T[] {
  const term = search.trim().toLowerCase();
  if (!term) {
    return items;
  }
  return items.filter((item) => {
    if (item.assetCode.toLowerCase().includes(term)) {
      return true;
    }
    if (item.name.toLowerCase().includes(term)) {
      return true;
    }
    if (item.vehicle?.plate.toLowerCase().includes(term)) {
      return true;
    }
    return false;
  });
}
