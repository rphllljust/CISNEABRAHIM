import { ASSET_ERROR_CODES, type AssetErrorCode } from '../types/physical-asset.types';

export const VERSION_CONFLICT_MESSAGE =
  'Outra alteração foi aplicada a este ativo. Recarregue os dados atuais antes de continuar.';

export const DEACTIVATION_CONSEQUENCE_MESSAGE =
  'O ativo deixará de estar ativo no cadastro. O histórico e identificadores permanecem preservados.';

export function mapAssetErrorToMessage(
  code: AssetErrorCode | undefined,
  status: number,
): string {
  switch (code) {
    case ASSET_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação em ativos físicos.';
    case ASSET_ERROR_CODES.NOT_FOUND:
      return 'Ativo físico não encontrado.';
    case ASSET_ERROR_CODES.VERSION_CONFLICT:
      return VERSION_CONFLICT_MESSAGE;
    case ASSET_ERROR_CODES.CODE_CONFLICT:
      return 'Já existe um ativo com este código.';
    case ASSET_ERROR_CODES.PLATE_CONFLICT:
      return 'Já existe um veículo com esta placa.';
    case ASSET_ERROR_CODES.INVALID_STATE:
      return 'Operação inválida para o estado atual do ativo.';
    case ASSET_ERROR_CODES.INACTIVE_RESOURCE_TYPE:
      return 'O tipo de recurso selecionado está inativo.';
    case ASSET_ERROR_CODES.INVALID_RESOURCE_TYPE:
      return 'Tipo de recurso inválido.';
    case ASSET_ERROR_CODES.VEHICLE_PROFILE_REQUIRED:
      return 'Veículos exigem placa.';
    case ASSET_ERROR_CODES.VEHICLE_PROFILE_FORBIDDEN:
      return 'Este tipo de ativo não aceita dados de veículo.';
    case ASSET_ERROR_CODES.UNIT_NOT_REGISTERED:
      return 'Unidade operacional não registrada.';
    case ASSET_ERROR_CODES.VALIDATION_FAILED:
      return 'Dados inválidos. Revise os campos e tente novamente.';
    default:
      if (status === 401) {
        return 'Sessão expirada. Faça login novamente.';
      }
      if (status >= 500) {
        return 'Serviço temporariamente indisponível.';
      }
      return 'Não foi possível concluir a operação.';
  }
}
