import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export const BASELINE_OPERATIONAL_LABOR_TYPES = [
  { code: 'DRIVER', name: 'Motorista' },
  { code: 'OPERATOR', name: 'Operador' },
  { code: 'HELPER', name: 'Ajudante' },
  { code: 'ELECTRICIAN', name: 'Eletricista' },
  { code: 'WELDER', name: 'Soldador' },
  { code: 'TECHNICIAN', name: 'Técnico' },
  { code: 'INSTALLER', name: 'Instalador' },
  { code: 'CONSTRUCTION_WORKER', name: 'Trabalhador de construção' },
  { code: 'SUPERVISOR', name: 'Supervisor' },
  { code: 'OTHER', name: 'Outra capacidade operacional' },
] as const;

export type BaselineOperationalLaborTypeCode =
  (typeof BASELINE_OPERATIONAL_LABOR_TYPES)[number]['code'];

export async function ensureOperationalLaborTypesBaseline(client: DbClient): Promise<void> {
  for (const laborType of BASELINE_OPERATIONAL_LABOR_TYPES) {
    await client.query(
      `INSERT INTO cat.operational_labor_types (code, name, status, version)
       VALUES ($1, $2, 'ACTIVE', 1)
       ON CONFLICT (code) DO NOTHING`,
      [laborType.code, laborType.name],
    );
  }
}
