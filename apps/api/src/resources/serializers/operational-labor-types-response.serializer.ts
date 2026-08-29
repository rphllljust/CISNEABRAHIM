import type { OperationalLaborTypeStatus } from '../domain/operational-labor-type';

export type OperationalLaborTypeRow = {
  id: string;
  code: string;
  name: string;
  status: OperationalLaborTypeStatus;
  version: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
};

export type OperationalLaborTypeResponse = {
  id: string;
  code: string;
  name: string;
  status: OperationalLaborTypeStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
};

export function toOperationalLaborTypeResponse(
  row: OperationalLaborTypeRow,
): OperationalLaborTypeResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
  };
}
