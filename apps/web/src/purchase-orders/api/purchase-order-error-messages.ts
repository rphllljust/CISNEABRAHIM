import {
  PURCHASE_ORDER_ERROR_CODES,
  type PurchaseOrderErrorCode,
} from '../types/purchase-order.types';

export const PURCHASE_ORDER_VERSION_CONFLICT_MESSAGE =
  'Este pedido de compra foi alterado por outro usuário. Recarregue os dados antes de tentar novamente.';

export function mapPurchaseOrderErrorToMessage(
  code: PurchaseOrderErrorCode | undefined,
  status: number,
): string {
  switch (code) {
    case PURCHASE_ORDER_ERROR_CODES.VERSION_CONFLICT:
      return PURCHASE_ORDER_VERSION_CONFLICT_MESSAGE;
    case PURCHASE_ORDER_ERROR_CODES.INVALID_STATE:
      return 'Esta operação não é permitida para o status atual do pedido.';
    case PURCHASE_ORDER_ERROR_CODES.VALIDATION_FAILED:
      return 'Verifique os dados informados e tente novamente.';
    case PURCHASE_ORDER_ERROR_CODES.NOT_FOUND:
      return 'Pedido de compra não encontrado.';
    case PURCHASE_ORDER_ERROR_CODES.DUPLICATE:
      return 'Já existe um pedido com este número para o cliente informado.';
    case PURCHASE_ORDER_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação.';
    case PURCHASE_ORDER_ERROR_CODES.CLIENT_INACTIVE:
      return 'O cliente selecionado está inativo.';
    case PURCHASE_ORDER_ERROR_CODES.UNIT_NOT_REGISTERED:
      return 'A unidade operacional informada não está registrada.';
    default:
      if (status === 403) {
        return 'Você não tem permissão para esta operação.';
      }
      if (status === 404) {
        return 'Pedido de compra não encontrado.';
      }
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
