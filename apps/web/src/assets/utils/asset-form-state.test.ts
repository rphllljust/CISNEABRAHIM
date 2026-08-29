import { describe, expect, it } from 'vitest';
import { VEHICLE_CLASSIFICATION } from '../types/physical-asset.types';
import {
  buildCreatePayload,
  filterAssetsBySearch,
  isVehicleResourceType,
  validateAssetForm,
} from './asset-form-state';

const RESOURCE_TYPES = [
  { id: 'truck', code: 'TRUCK', name: 'Caminhão', classification: VEHICLE_CLASSIFICATION, status: 'ACTIVE' },
  { id: 'exc', code: 'EXCAVATOR', name: 'Escavadeira', classification: 'MACHINE', status: 'ACTIVE' },
];

describe('asset-form-state', () => {
  it('requires plate only for vehicle resource types', () => {
    expect(isVehicleResourceType('truck', RESOURCE_TYPES)).toBe(true);
    expect(isVehicleResourceType('exc', RESOURCE_TYPES)).toBe(false);

    const vehicleErrors = validateAssetForm(
      {
        assetCode: 'TRK-1',
        resourceTypeId: 'truck',
        name: 'Caminhão',
        unitId: 'unit-a',
        plate: '',
        chassis: '',
        model: '',
      },
      RESOURCE_TYPES,
      'create',
    );
    expect(vehicleErrors.plate).toBeDefined();

    const machineErrors = validateAssetForm(
      {
        assetCode: 'EXC-1',
        resourceTypeId: 'exc',
        name: 'Máquina',
        unitId: 'unit-a',
        plate: '',
        chassis: '',
        model: '',
      },
      RESOURCE_TYPES,
      'create',
    );
    expect(machineErrors.plate).toBeUndefined();
  });

  it('builds create payload without vehicle block for machines', () => {
    const payload = buildCreatePayload(
      {
        assetCode: 'exc-1',
        resourceTypeId: 'exc',
        name: 'Escavadeira',
        unitId: 'unit-a',
        plate: '',
        chassis: '',
        model: '',
      },
      RESOURCE_TYPES,
    );
    expect(payload.vehicle).toBeUndefined();
  });

  it('filters assets by code, name and plate', () => {
    const items = [
      {
        assetCode: 'TRK-001',
        name: 'Caminhão',
        vehicle: { plate: 'ABC-1234' },
      },
      {
        assetCode: 'EXC-001',
        name: 'Escavadeira',
        vehicle: null,
      },
    ];
    expect(filterAssetsBySearch(items, 'abc')).toHaveLength(1);
    expect(filterAssetsBySearch(items, 'escav')).toHaveLength(1);
  });
});
