import { BILLING_ERROR_CODES } from '../types/billing.types';

export function mapBillingErrorToMessage(code: string | undefined, status: number): string {
  switch (code) {
    case BILLING_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação de faturamento.';
    case BILLING_ERROR_CODES.NOT_FOUND:
    case BILLING_ERROR_CODES.SERVICE_ORDER_NOT_FOUND:
    case BILLING_ERROR_CODES.MEASUREMENT_NOT_FOUND:
      return 'Registro de faturamento não encontrado.';
    case BILLING_ERROR_CODES.MEASUREMENT_NOT_APPROVED:
      return 'A medição precisa estar aprovada antes da preparação de faturamento.';
    case BILLING_ERROR_CODES.BILLING_ALREADY_EXISTS:
      return 'Já existe uma preparação ativa para esta medição.';
    case BILLING_ERROR_CODES.BILLING_AMOUNT_MISMATCH:
      return 'O total informado não confere com a soma dos itens da medição.';
    case BILLING_ERROR_CODES.COMMERCIAL_TERMS_MISMATCH:
      return 'As condições comerciais declaradas divergem da fonte autoritativa.';
    case BILLING_ERROR_CODES.VERSION_CONFLICT:
      return 'O registro foi alterado por outra pessoa. Recarregue para revisar os dados atuais.';
    case BILLING_ERROR_CODES.INVALID_STATE:
      return 'A operação não é permitida no estado atual do faturamento.';
    case BILLING_ERROR_CODES.BILLING_DOCUMENT_ALREADY_EXISTS:
      return 'Já existe uma Nota Fatura ativa para esta preparação.';
    case BILLING_ERROR_CODES.BILLING_DOCUMENT_NOT_FOUND:
      return 'Documento de faturamento não encontrado.';
    case BILLING_ERROR_CODES.BILLING_DOCUMENT_IMMUTABLE:
      return 'Documentos finalizados não podem ser alterados. Use cancelamento ou substituição.';
    case BILLING_ERROR_CODES.BILLING_DOCUMENT_STORAGE_FAILED:
      return 'Falha ao armazenar o PDF. Tente novamente.';
    case BILLING_ERROR_CODES.VALIDATION_FAILED:
      return 'Verifique os campos informados.';
    default:
      if (status === 0) {
        return 'Falha de rede. Verifique sua conexão e tente novamente.';
      }
      return 'Não foi possível concluir a operação de faturamento.';
  }
}
