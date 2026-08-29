import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export const BASELINE_PHYSICAL_RESOURCE_TYPES = [
  { code: 'CAR', name: 'Automóvel', classification: 'VEHICLE' },
  { code: 'TRUCK', name: 'Caminhão', classification: 'VEHICLE' },
  { code: 'WATER_TRUCK', name: 'Caminhão pipa', classification: 'VEHICLE' },
  { code: 'BUS', name: 'Ônibus', classification: 'VEHICLE' },
  { code: 'MOTORCYCLE', name: 'Motocicleta', classification: 'VEHICLE' },
  { code: 'GRADER', name: 'Motoniveladora', classification: 'MACHINE' },
  { code: 'EXCAVATOR', name: 'Escavadeira', classification: 'MACHINE' },
  { code: 'LOADER', name: 'Pá carregadeira', classification: 'MACHINE' },
  { code: 'COMPACTOR', name: 'Compactador', classification: 'MACHINE' },
  { code: 'LIFTING_EQUIPMENT', name: 'Equipamento de içamento', classification: 'EQUIPMENT' },
  { code: 'WELDING_EQUIPMENT', name: 'Equipamento de solda', classification: 'EQUIPMENT' },
  { code: 'ELECTRICAL_EQUIPMENT', name: 'Equipamento elétrico', classification: 'EQUIPMENT' },
  { code: 'DRILLING_EQUIPMENT', name: 'Equipamento de perfuração', classification: 'EQUIPMENT' },
  { code: 'GENERATOR', name: 'Gerador', classification: 'EQUIPMENT' },
  { code: 'CONSTRUCTION_EQUIPMENT', name: 'Equipamento de construção', classification: 'EQUIPMENT' },
  { code: 'MATERIAL', name: 'Material', classification: 'MATERIAL' },
  { code: 'OTHER', name: 'Outro recurso físico', classification: 'EQUIPMENT' },
] as const;

export type BaselinePhysicalResourceTypeCode =
  (typeof BASELINE_PHYSICAL_RESOURCE_TYPES)[number]['code'];

export async function ensurePhysicalResourceTypesBaseline(client: DbClient): Promise<void> {
  for (const resourceType of BASELINE_PHYSICAL_RESOURCE_TYPES) {
    await client.query(
      `INSERT INTO cat.physical_resource_types (code, name, classification, status, version)
       VALUES ($1, $2, $3::cat.physical_resource_classification, 'ACTIVE', 1)
       ON CONFLICT (code) DO NOTHING`,
      [resourceType.code, resourceType.name, resourceType.classification],
    );
  }
}
