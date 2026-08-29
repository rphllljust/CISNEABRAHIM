import { REQUEST_ERROR_CODES, type RequestErrorCode } from '../types/service-request.types';

export const VERSION_CONFLICT_MESSAGE =
  'Esta solicitação foi alterada por outro usuário. Recarregue os dados antes de tentar novamente.';

export function mapRequestErrorToMessage(code: RequestErrorCode | undefined, status: number): string {
  switch (code) {
    case REQUEST_ERROR_CODES.VERSION_CONFLICT:
      return VERSION_CONFLICT_MESSAGE;
    case REQUEST_ERROR_CODES.INVALID_STATE:
      return 'Esta operação não é permitida para o status atual da solicitação.';
    case REQUEST_ERROR_CODES.VALIDATION_FAILED:
      return 'Verifique os dados informados e tente novamente.';
    case REQUEST_ERROR_CODES.NOT_FOUND:
      return 'Solicitação não encontrada.';
    case REQUEST_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação.';
    case REQUEST_ERROR_CODES.CLIENT_INACTIVE:
      return 'O Cliente selecionado está inativo.';
    case REQUEST_ERROR_CODES.UNIT_NOT_REGISTERED:
      return 'A unidade operacional informada não está registrada.';
    default:
      if (status === 403) {
        return 'Você não tem permissão para esta operação.';
      }
      if (status === 404) {
        return 'Solicitação não encontrada.';
      }
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
