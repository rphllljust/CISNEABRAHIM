import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export const BASELINE_UNITS_OF_MEASURE = [
  { code: 'UN', name: 'Unidade', category: 'COUNT', decimalScale: 0 },
  { code: 'UA', name: 'Unidade de atendimento', category: 'COUNT', decimalScale: 0 },
  { code: 'HOUR', name: 'Hora', category: 'TIME', decimalScale: 2 },
  { code: 'DAY', name: 'Dia', category: 'TIME', decimalScale: 0 },
  { code: 'SHIFT', name: 'Turno', category: 'TIME', decimalScale: 0 },
  { code: 'MONTH', name: 'Mês', category: 'TIME', decimalScale: 0 },
  { code: 'KM', name: 'Quilômetro', category: 'DISTANCE', decimalScale: 3 },
  { code: 'M', name: 'Metro', category: 'LENGTH', decimalScale: 3 },
  { code: 'M2', name: 'Metro quadrado', category: 'AREA', decimalScale: 3 },
  { code: 'M3', name: 'Metro cúbico', category: 'VOLUME', decimalScale: 3 },
  { code: 'TON', name: 'Tonelada', category: 'MASS', decimalScale: 3 },
  { code: 'TRIP', name: 'Viagem', category: 'COUNT', decimalScale: 0 },
  { code: 'SERVICE', name: 'Serviço', category: 'SERVICE', decimalScale: 0 },
] as const;

export type BaselineUnitCode = (typeof BASELINE_UNITS_OF_MEASURE)[number]['code'];

export async function ensureUnitsOfMeasureBaseline(client: DbClient): Promise<void> {
  for (const unit of BASELINE_UNITS_OF_MEASURE) {
    await client.query(
      `INSERT INTO cat.units_of_measure (code, name, category, decimal_scale, status, version)
       VALUES ($1, $2, $3::cat.unit_of_measure_category, $4, 'ACTIVE', 1)
       ON CONFLICT (code) DO NOTHING`,
      [unit.code, unit.name, unit.category, unit.decimalScale],
    );
  }
}
