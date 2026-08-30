export const PRIVILEGED_PAYLOAD_FIELDS = [
  'status',
  'createdBy',
  'created_by',
  'approvedBy',
  'approved_by',
  'updatedBy',
  'updated_by',
  'role',
  'scope',
  'internalCost',
  'internal_cost',
  'price',
  'rowVersion',
  'row_version',
] as const;

export const PRIVILEGED_CREATE_ONLY_FIELDS = ['version'] as const;

export class PrivilegedFieldError extends Error {
  readonly code = 'PRIVILEGED_FIELD_REJECTED';
  readonly field: string;

  constructor(field: string) {
    super(`Field "${field}" is not accepted in this request.`);
    this.field = field;
  }
}

export function assertNoPrivilegedFields(
  body: Record<string, unknown>,
  options?: { allowVersion?: boolean; allowRowVersion?: boolean },
): void {
  const allowVersion = options?.allowVersion ?? false;
  const allowRowVersion = options?.allowRowVersion ?? false;
  const forbidden = new Set<string>(PRIVILEGED_PAYLOAD_FIELDS);
  if (!allowVersion) {
    for (const field of PRIVILEGED_CREATE_ONLY_FIELDS) {
      forbidden.add(field);
    }
  }
  if (allowRowVersion) {
    forbidden.delete('rowVersion');
    forbidden.delete('row_version');
  }

  for (const key of Object.keys(body)) {
    if (forbidden.has(key)) {
      throw new PrivilegedFieldError(key);
    }
  }
}
