import { CONTRACT_ERROR_CODES, type ContractErrorCode } from '../types';

export const CONTRACT_VERSION_CONFLICT_MESSAGE =
  'Este contrato foi alterado por outro usuário. Recarregue os dados antes de tentar novamente.';

export function mapContractErrorToMessage(
  code: ContractErrorCode | undefined,
  status: number,
): string {
  switch (code) {
    case CONTRACT_ERROR_CODES.VERSION_CONFLICT:
      return CONTRACT_VERSION_CONFLICT_MESSAGE;
    case CONTRACT_ERROR_CODES.INVALID_STATE:
      return 'Esta operação não é permitida para o status atual do contrato.';
    case CONTRACT_ERROR_CODES.VALIDATION_FAILED:
      return 'Verifique os dados informados e tente novamente.';
    case CONTRACT_ERROR_CODES.NOT_FOUND:
      return 'Contrato não encontrado.';
    case CONTRACT_ERROR_CODES.DUPLICATE:
      return 'Já existe um contrato com este número para o cliente informado.';
    case CONTRACT_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação.';
    case CONTRACT_ERROR_CODES.CLIENT_INACTIVE:
      return 'O cliente vinculado ao contrato está inativo.';
    case CONTRACT_ERROR_CODES.UNIT_NOT_REGISTERED:
      return 'A unidade operacional informada não está registrada.';
    case CONTRACT_ERROR_CODES.CLIENT_NOT_FOUND:
      return 'Cliente não encontrado.';
    case CONTRACT_ERROR_CODES.SERVICE_NOT_FOUND:
      return 'Definição de serviço não encontrada.';
    case CONTRACT_ERROR_CODES.DOCUMENT_NOT_FOUND:
      return 'Documento não encontrado.';
    case CONTRACT_ERROR_CODES.CLIENT_MISMATCH:
      return 'O contrato não pertence ao cliente informado.';
    case CONTRACT_ERROR_CODES.NOT_ACTIVE:
      return 'O contrato não está ativo para esta operação.';
    case CONTRACT_ERROR_CODES.NOT_YET_VALID:
      return 'O contrato ainda não entrou em vigor para esta operação.';
    case CONTRACT_ERROR_CODES.EXPIRED:
      return 'O contrato está expirado.';
    case CONTRACT_ERROR_CODES.CLOSED:
      return 'O contrato está encerrado.';
    default:
      if (status === 403) {
        return 'Você não tem permissão para esta operação.';
      }
      if (status === 404) {
        return 'Contrato não encontrado.';
      }
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
