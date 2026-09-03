import { HttpStatus } from '@nestjs/common';
import { parseQueryPositiveInt } from '../../infrastructure/http/contracts';
import {
  isValidAssetCodeFormat,
  isValidNormalizedPlate,
  normalizeAssetCode,
  normalizePlate,
  ASSET_LIFECYCLE_STATUSES,
  ASSET_OPERATIONAL_AVAILABILITIES,
  type AssetOperationalAvailability,
  VEHICLE_CLASSIFICATION,
} from '../domain/physical-asset';
import { ASSET_ERROR_CODES } from '../errors/asset-error-codes';
import { AssetHttpException } from '../errors/asset-http.exception';

function assertObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AssetHttpException(
      HttpStatus.BAD_REQUEST,
      ASSET_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return value as Record<string, unknown>;
}

function parseRequiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string') {
    throw new AssetHttpException(
      HttpStatus.BAD_REQUEST,
      ASSET_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return value;
}

function parseOptionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new AssetHttpException(
      HttpStatus.BAD_REQUEST,
      ASSET_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return value;
}

function parsePositiveInt(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  throw new AssetHttpException(
    HttpStatus.BAD_REQUEST,
    ASSET_ERROR_CODES.VALIDATION_FAILED,
    `Invalid ${field}.`,
  );
}
export type VehicleProfileInput = {
  plate: string;
  normalizedPlate: string;
  plateDisplay: string;
  chassis?: string;
  model?: string;
};

export type CreatePhysicalAssetInput = {
  assetCode: string;
  resourceTypeId: string;
  name: string;
  unitId: string;
  vehicle?: VehicleProfileInput;
};

function parseVehicleProfile(body: Record<string, unknown>): VehicleProfileInput {
  const plateRaw = parseRequiredString(body, 'plate');
  const { normalized, display } = normalizePlate(plateRaw);
  if (!isValidNormalizedPlate(normalized)) {
    throw new AssetHttpException(
      HttpStatus.BAD_REQUEST,
      ASSET_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  const chassis = parseOptionalString(body, 'chassis')?.trim();
  const model = parseOptionalString(body, 'model')?.trim();

  return {
    plate: plateRaw,
    normalizedPlate: normalized,
    plateDisplay: display,
    chassis: chassis && chassis.length > 0 ? chassis : undefined,
    model: model && model.length > 0 ? model : undefined,
  };
}

export function parseCreatePhysicalAssetInput(body: unknown): CreatePhysicalAssetInput {
  const record = assertObject(body);
  const assetCode = normalizeAssetCode(parseRequiredString(record, 'assetCode'));
  if (!isValidAssetCodeFormat(assetCode)) {
    throw new AssetHttpException(
      HttpStatus.BAD_REQUEST,
      ASSET_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  const name = parseRequiredString(record, 'name').trim();
  if (name.length === 0) {
    throw new AssetHttpException(
      HttpStatus.BAD_REQUEST,
      ASSET_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  const unitId = parseRequiredString(record, 'unitId').trim();
  if (unitId.length === 0) {
    throw new AssetHttpException(
      HttpStatus.BAD_REQUEST,
      ASSET_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  const resourceTypeId = parseRequiredString(record, 'resourceTypeId').trim();

  let vehicle: VehicleProfileInput | undefined;
  if (record['vehicle'] !== undefined && record['vehicle'] !== null) {
    vehicle = parseVehicleProfile(assertObject(record['vehicle']));
  }

  return {
    assetCode,
    resourceTypeId,
    name,
    unitId,
    vehicle,
  };
}

export type UpdatePhysicalAssetInput = {
  version: number;
  name?: string;
  vehicle?: VehicleProfileInput;
};

export function parseUpdatePhysicalAssetInput(body: unknown): UpdatePhysicalAssetInput {
  const record = assertObject(body);
  const version = parsePositiveInt(record['version'], 'version');

  let name: string | undefined;
  if (record['name'] !== undefined) {
    name = parseRequiredString(record, 'name').trim();
    if (name.length === 0) {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
  }

  let vehicle: VehicleProfileInput | undefined;
  if (record['vehicle'] !== undefined && record['vehicle'] !== null) {
    vehicle = parseVehicleProfile(assertObject(record['vehicle']));
  }

  if (name === undefined && vehicle === undefined) {
    throw new AssetHttpException(
      HttpStatus.BAD_REQUEST,
      ASSET_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  return { version, name, vehicle };
}

export function parsePhysicalAssetTransitionInput(body: unknown): { version: number } {
  const record = assertObject(body);
  return { version: parsePositiveInt(record['version'], 'version') };
}

export function parseListPhysicalAssetsQuery(query: Record<string, unknown>): {
  limit: number;
  offset: number;
  lifecycleStatus?: 'ACTIVE' | 'INACTIVE';
  allocationStatus?: 'AVAILABLE' | 'ALLOCATED';
  availability?: AssetOperationalAvailability;
  resourceTypeId?: string;
  classification?: typeof VEHICLE_CLASSIFICATION;
  q?: string;
} {
  const limitRaw = query['limit'];
  const offsetRaw = query['offset'];
  const lifecycleStatusRaw = query['lifecycleStatus'];
  const allocationStatusRaw = query['allocationStatus'];
  const availabilityRaw = query['availability'];
  const resourceTypeIdRaw = query['resourceTypeId'];
  const classificationRaw = query['classification'];
  const qRaw = query['q'];

  let limit = 50;
  if (limitRaw !== undefined) {
    const parsed = parseQueryPositiveInt(limitRaw);
    if (parsed === null || parsed < 1 || parsed > 100) {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    limit = parsed;
  }

  let offset = 0;
  if (offsetRaw !== undefined) {
    const parsed = parseQueryPositiveInt(offsetRaw);
    if (parsed === null || parsed < 0) {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    offset = parsed;
  }

  let lifecycleStatus: 'ACTIVE' | 'INACTIVE' | undefined;
  if (lifecycleStatusRaw !== undefined) {
    if (
      lifecycleStatusRaw !== ASSET_LIFECYCLE_STATUSES.Active &&
      lifecycleStatusRaw !== ASSET_LIFECYCLE_STATUSES.Inactive
    ) {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    lifecycleStatus = lifecycleStatusRaw;
  }

  let allocationStatus: 'AVAILABLE' | 'ALLOCATED' | undefined;
  if (allocationStatusRaw !== undefined) {
    if (allocationStatusRaw !== 'AVAILABLE' && allocationStatusRaw !== 'ALLOCATED') {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    allocationStatus = allocationStatusRaw;
  }

  let availability: AssetOperationalAvailability | undefined;
  if (availabilityRaw !== undefined) {
    const allowed = Object.values(ASSET_OPERATIONAL_AVAILABILITIES);
    if (
      typeof availabilityRaw !== 'string' ||
      !allowed.includes(availabilityRaw as AssetOperationalAvailability)
    ) {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    availability = availabilityRaw as AssetOperationalAvailability;
  }

  let resourceTypeId: string | undefined;
  if (resourceTypeIdRaw !== undefined) {
    if (typeof resourceTypeIdRaw !== 'string' || resourceTypeIdRaw.trim().length === 0) {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    resourceTypeId = resourceTypeIdRaw.trim();
  }

  let classification: typeof VEHICLE_CLASSIFICATION | undefined;
  if (classificationRaw !== undefined) {
    if (classificationRaw !== VEHICLE_CLASSIFICATION) {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    classification = VEHICLE_CLASSIFICATION;
  }

  let q: string | undefined;
  if (qRaw !== undefined) {
    if (typeof qRaw !== 'string') {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    const trimmed = qRaw.trim();
    if (trimmed.length > 0) {
      q = trimmed;
    }
  }

  return { limit, offset, lifecycleStatus, allocationStatus, availability, resourceTypeId, classification, q };
}

export function parsePhysicalAssetSummaryQuery(query: Record<string, unknown>): {
  resourceTypeId?: string;
  classification?: typeof VEHICLE_CLASSIFICATION;
} {
  const resourceTypeIdRaw = query['resourceTypeId'];
  const classificationRaw = query['classification'];

  let resourceTypeId: string | undefined;
  if (resourceTypeIdRaw !== undefined) {
    if (typeof resourceTypeIdRaw !== 'string' || resourceTypeIdRaw.trim().length === 0) {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    resourceTypeId = resourceTypeIdRaw.trim();
  }

  let classification: typeof VEHICLE_CLASSIFICATION | undefined;
  if (classificationRaw !== undefined) {
    if (classificationRaw !== VEHICLE_CLASSIFICATION) {
      throw new AssetHttpException(
        HttpStatus.BAD_REQUEST,
        ASSET_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    classification = VEHICLE_CLASSIFICATION;
  }

  return { resourceTypeId, classification };
}
