import { CATALOG_ERROR_CODES, type CatalogErrorCode } from '../types/service-catalog.types';

export const VERSION_CONFLICT_MESSAGE =
  'Outra alteração foi aplicada a esta definição. Recarregue os dados atuais antes de continuar.';

export const DEACTIVATION_CONSEQUENCE_MESSAGE =
  'A definição deixará de estar disponível para novas operações. Versões publicadas anteriores permanecem no histórico.';

export function mapCatalogErrorToMessage(
  code: CatalogErrorCode | undefined,
  status: number,
): string {
  switch (code) {
    case CATALOG_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação no catálogo.';
    case CATALOG_ERROR_CODES.NOT_FOUND:
      return 'Definição de serviço não encontrada.';
    case CATALOG_ERROR_CODES.VERSION_CONFLICT:
      return VERSION_CONFLICT_MESSAGE;
    case CATALOG_ERROR_CODES.CODE_CONFLICT:
      return 'Já existe uma definição com este código.';
    case CATALOG_ERROR_CODES.INVALID_STATE:
      return 'Operação inválida para o estado atual da definição ou versão.';
    case CATALOG_ERROR_CODES.PUBLISH_INVALID:
      return 'A versão em rascunho não atende aos requisitos mínimos de publicação.';
    case CATALOG_ERROR_CODES.VALIDATION_FAILED:
      return 'Dados inválidos. Revise os campos e tente novamente.';
    default:
      if (status === 401) {
        return 'Sessão expirada. Faça login novamente.';
      }
      if (status >= 500) {
        return 'Serviço temporariamente indisponível.';
      }
      return 'Não foi possível concluir a operação no catálogo.';
  }
}
