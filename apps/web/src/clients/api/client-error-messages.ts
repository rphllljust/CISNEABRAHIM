import { CLIENT_ERROR_CODES, type ClientErrorCode } from '../types/client.types';

export const VERSION_CONFLICT_MESSAGE =
  'Este Cliente foi alterado por outro usuário. Atualize os dados antes de tentar novamente.';

export const DEACTIVATION_CONSEQUENCE_MESSAGE =
  'Cliente desativado não poderá ser utilizado em novas operações incompatíveis, mas seu histórico será preservado.';

export function mapClientErrorToMessage(code: ClientErrorCode | undefined, status: number): string {
  switch (code) {
    case CLIENT_ERROR_CODES.TAX_ID_CONFLICT:
      return 'Já existe um Cliente cadastrado com este CNPJ.';
    case CLIENT_ERROR_CODES.VERSION_CONFLICT:
      return VERSION_CONFLICT_MESSAGE;
    case CLIENT_ERROR_CODES.INVALID_STATE:
      return 'Esta operação não é permitida para o status atual do Cliente.';
    case CLIENT_ERROR_CODES.VALIDATION_FAILED:
      return 'Verifique os dados informados e tente novamente.';
    case CLIENT_ERROR_CODES.NOT_FOUND:
      return 'Cliente não encontrado.';
    case CLIENT_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação.';
    default:
      if (status === 403) {
        return 'Você não tem permissão para esta operação.';
      }
      if (status === 404) {
        return 'Cliente não encontrado.';
      }
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
