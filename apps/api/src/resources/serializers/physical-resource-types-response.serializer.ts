import type {
  PhysicalResourceClassification,
  PhysicalResourceTypeStatus,
} from '../domain/physical-resource-type';

export type PhysicalResourceTypeRow = {
  id: string;
  code: string;
  name: string;
  classification: PhysicalResourceClassification;
  status: PhysicalResourceTypeStatus;
  version: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
};

export type PhysicalResourceTypeResponse = {
  id: string;
  code: string;
  name: string;
  classification: PhysicalResourceClassification;
  status: PhysicalResourceTypeStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
};

export function toPhysicalResourceTypeResponse(
  row: PhysicalResourceTypeRow,
): PhysicalResourceTypeResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    classification: row.classification,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
  };
}
