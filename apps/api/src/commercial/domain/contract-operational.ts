export const CONTRACT_OPERATIONAL_ERROR_CODES = {
  CLIENT_MISMATCH: 'CONTRACT_CLIENT_MISMATCH',
  NOT_ACTIVE: 'CONTRACT_NOT_ACTIVE',
  NOT_YET_VALID: 'CONTRACT_NOT_YET_VALID',
  EXPIRED: 'CONTRACT_EXPIRED',
  CLOSED: 'CONTRACT_CLOSED',
} as const;

export class ContractOperationalError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type ContractOperationalSource = {
  clientId: string;
  status: string;
  validFrom: string;
  validTo: string | null;
};

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function assertContractOperationalUse(
  contract: ContractOperationalSource,
  clientId: string,
  asOf: Date = new Date(),
): void {
  if (contract.clientId !== clientId) {
    throw new ContractOperationalError(CONTRACT_OPERATIONAL_ERROR_CODES.CLIENT_MISMATCH);
  }
  if (contract.status === 'CLOSED') {
    throw new ContractOperationalError(CONTRACT_OPERATIONAL_ERROR_CODES.CLOSED);
  }
  if (contract.status === 'EXPIRED') {
    throw new ContractOperationalError(CONTRACT_OPERATIONAL_ERROR_CODES.EXPIRED);
  }
  if (contract.status !== 'ACTIVE') {
    throw new ContractOperationalError(CONTRACT_OPERATIONAL_ERROR_CODES.NOT_ACTIVE);
  }

  const today = formatDateOnly(asOf);
  if (today < contract.validFrom) {
    throw new ContractOperationalError(CONTRACT_OPERATIONAL_ERROR_CODES.NOT_YET_VALID);
  }
  if (contract.validTo && today > contract.validTo) {
    throw new ContractOperationalError(CONTRACT_OPERATIONAL_ERROR_CODES.EXPIRED);
  }
}

export function assertContractActivationValidity(input: {
  validFrom: string;
  validTo: string | null;
  asOf?: Date;
}): void {
  const today = formatDateOnly(input.asOf ?? new Date());
  if (today < input.validFrom) {
    throw new ContractOperationalError(CONTRACT_OPERATIONAL_ERROR_CODES.NOT_YET_VALID);
  }
  if (input.validTo && today > input.validTo) {
    throw new ContractOperationalError(CONTRACT_OPERATIONAL_ERROR_CODES.EXPIRED);
  }
}
