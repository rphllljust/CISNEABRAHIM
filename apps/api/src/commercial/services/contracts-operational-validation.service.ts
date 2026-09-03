import { Injectable } from '@nestjs/common';
import {
  assertContractOperationalUse,
  CONTRACT_OPERATIONAL_ERROR_CODES,
  ContractOperationalError,
} from '../domain/contract-operational';
import { buildContractOperationalSnapshot } from '../domain/contract-snapshot';
import type { ContractOperationalSnapshot } from '../domain/contract-snapshot';
import { ContractsRepository } from '../repositories/contracts.repository';
import type { ContractItemRow, ContractRow } from '../repositories/contracts.repository.types';
import {
  contractsAccessNotFound,
  contractsClientMismatch,
  contractsClosed,
  contractsExpired,
  contractsNotActive,
  contractsNotYetValid,
} from './contracts-access.errors';

export type ContractOperationalResolution = {
  contract: ContractRow;
  items: ContractItemRow[];
  snapshot: ContractOperationalSnapshot;
};

@Injectable()
export class ContractsOperationalValidationService {
  constructor(private readonly contractsRepository: ContractsRepository) {}

  async resolveContractForOperationalUse(
    clientId: string,
    reference: string,
  ): Promise<ContractOperationalResolution> {
    const contract = await this.contractsRepository.findByReference(clientId, reference);
    if (!contract) {
      throw contractsAccessNotFound();
    }

    return this.buildOperationalResolution(contract, clientId);
  }

  async tryResolveContractForOperationalUse(
    clientId: string,
    reference: string,
  ): Promise<ContractOperationalResolution | null> {
    const contract = await this.contractsRepository.findByReference(clientId, reference);
    if (!contract) {
      return null;
    }

    return this.buildOperationalResolution(contract, clientId);
  }

  private async buildOperationalResolution(
    contract: ContractRow,
    clientId: string,
  ): Promise<ContractOperationalResolution> {
    try {
      assertContractOperationalUse(
        {
          clientId: contract.client_id,
          status: contract.status,
          validFrom: contract.valid_from,
          validTo: contract.valid_to,
        },
        clientId,
      );
    } catch (error) {
      if (error instanceof ContractOperationalError) {
        this.mapOperationalError(error);
      }
      throw error;
    }

    const items = await this.contractsRepository.listItems(contract.id);
    return {
      contract,
      items,
      snapshot: buildContractOperationalSnapshot(contract, items),
    };
  }

  private mapOperationalError(error: ContractOperationalError): never {
    switch (error.code) {
      case CONTRACT_OPERATIONAL_ERROR_CODES.CLIENT_MISMATCH:
        throw contractsClientMismatch();
      case CONTRACT_OPERATIONAL_ERROR_CODES.NOT_ACTIVE:
        throw contractsNotActive();
      case CONTRACT_OPERATIONAL_ERROR_CODES.NOT_YET_VALID:
        throw contractsNotYetValid();
      case CONTRACT_OPERATIONAL_ERROR_CODES.EXPIRED:
        throw contractsExpired();
      case CONTRACT_OPERATIONAL_ERROR_CODES.CLOSED:
        throw contractsClosed();
      default:
        throw contractsNotActive();
    }
  }
}
