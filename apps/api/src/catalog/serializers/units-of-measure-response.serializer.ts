import type { UnitOfMeasureCategory, UnitOfMeasureStatus } from '../domain/unit-of-measure';

export type UnitOfMeasureRow = {
  id: string;
  code: string;
  name: string;
  category: UnitOfMeasureCategory;
  decimal_scale: number;
  status: UnitOfMeasureStatus;
  version: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
};

export type UnitOfMeasureResponse = {
  id: string;
  code: string;
  name: string;
  category: UnitOfMeasureCategory;
  decimalScale: number;
  status: UnitOfMeasureStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
};

export function toUnitOfMeasureResponse(row: UnitOfMeasureRow): UnitOfMeasureResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    decimalScale: row.decimal_scale,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
  };
}
