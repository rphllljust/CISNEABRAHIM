import { SERVICE_ORDERS_ERROR_CODES } from '../types/service-order.types';

export function mapServiceOrdersErrorToMessage(
  code: string | undefined,
  status: number,
): string {
  switch (code) {
    case SERVICE_ORDERS_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação.';
    case SERVICE_ORDERS_ERROR_CODES.NOT_FOUND:
      return 'Ordem de serviço não encontrada.';
    case SERVICE_ORDERS_ERROR_CODES.VERSION_CONFLICT:
      return 'Os dados foram alterados por outra operação. Recarregue e tente novamente.';
    case SERVICE_ORDERS_ERROR_CODES.INVALID_STATE:
      return 'A operação não é permitida no estado atual da ordem de serviço.';
    case SERVICE_ORDERS_ERROR_CODES.ASSET_NOT_FOUND:
      return 'Ativo físico não encontrado.';
    case SERVICE_ORDERS_ERROR_CODES.ASSET_INACTIVE:
      return 'O ativo selecionado está inativo no cadastro.';
    case SERVICE_ORDERS_ERROR_CODES.ALLOCATION_CONFLICT:
      return 'O ativo não está disponível no intervalo solicitado. Escolha outro recurso ou ajuste o horário.';
    case SERVICE_ORDERS_ERROR_CODES.RESOURCE_TYPE_MISMATCH:
      return 'O tipo do ativo não corresponde ao requisito planejado.';
    case SERVICE_ORDERS_ERROR_CODES.RESOURCE_TYPE_NOT_REQUIRED:
      return 'Este tipo de recurso não faz parte dos requisitos do serviço.';
    case SERVICE_ORDERS_ERROR_CODES.ALLOCATION_OUTSIDE_WINDOW:
      return 'O intervalo de alocação está fora da janela operacional planejada.';
    case SERVICE_ORDERS_ERROR_CODES.PLANNED_RESOURCE_NOT_FOUND:
      return 'Item de planejamento não encontrado.';
    case SERVICE_ORDERS_ERROR_CODES.ALLOCATION_NOT_FOUND:
      return 'Alocação não encontrada.';
    case SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED:
      return 'Verifique os campos informados.';
    case SERVICE_ORDERS_ERROR_CODES.MINIMUM_RESOURCES_NOT_MET:
      return 'O planejamento mínimo ainda não foi atendido. Conclua o planejamento antes de iniciar.';
    case SERVICE_ORDERS_ERROR_CODES.REQUIRED_EVIDENCE_MISSING:
      return 'Registre todas as evidências obrigatórias antes de concluir.';
    default:
      if (status === 0) {
        return 'Falha de rede. Verifique sua conexão e tente novamente.';
      }
      return 'Não foi possível concluir a operação.';
  }
}
