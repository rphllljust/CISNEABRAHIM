import { MEASUREMENTS_ERROR_CODES } from '../types/measurement.types';

export function mapMeasurementsErrorToMessage(code: string | undefined, status: number): string {
  switch (code) {
    case MEASUREMENTS_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação de medição.';
    case MEASUREMENTS_ERROR_CODES.NOT_FOUND:
    case MEASUREMENTS_ERROR_CODES.SERVICE_ORDER_NOT_FOUND:
    case MEASUREMENTS_ERROR_CODES.ITEM_NOT_FOUND:
      return 'Medição ou item não encontrado.';
    case MEASUREMENTS_ERROR_CODES.VERSION_CONFLICT:
      return 'A medição foi alterada por outra pessoa. Recarregue para revisar os dados atuais.';
    case MEASUREMENTS_ERROR_CODES.INVALID_STATE:
      return 'A operação não é permitida no estado atual da medição.';
    case MEASUREMENTS_ERROR_CODES.NOT_EDITABLE:
      return 'A medição não pode mais ser editada neste estado.';
    case MEASUREMENTS_ERROR_CODES.SERVICE_ORDER_NOT_COMPLETED:
      return 'A ordem de serviço precisa estar concluída para gerar medição.';
    case MEASUREMENTS_ERROR_CODES.MEASUREMENT_ALREADY_EXISTS:
      return 'Já existe uma medição ativa para esta ordem de serviço.';
    case MEASUREMENTS_ERROR_CODES.MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED:
      return 'A quantidade medida excede o realizado. Autorize um ajuste formal antes de alterar.';
    case MEASUREMENTS_ERROR_CODES.SEPARATION_OF_DUTIES_VIOLATION:
      return 'Quem submeteu a medição não pode aprová-la. Solicite outro revisor.';
    case MEASUREMENTS_ERROR_CODES.VALIDATION_FAILED:
      return 'Verifique os campos informados.';
    default:
      if (status === 0) {
        return 'Falha de rede. Verifique sua conexão e tente novamente.';
      }
      return 'Não foi possível concluir a operação de medição.';
  }
}
