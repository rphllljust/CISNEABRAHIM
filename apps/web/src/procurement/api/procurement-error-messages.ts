export function mapProcurementErrorToMessage(code: string | undefined, status: number): string {
  switch (code) {
    case 'PROCUREMENT_DENIED':
      return 'Você não tem permissão para esta operação de compra.';
    case 'PROCUREMENT_NOT_FOUND':
      return 'Solicitação, pedido ou nota não encontrado.';
    case 'PROCUREMENT_VERSION_CONFLICT':
      return 'A versão mudou. Recarregue os dados atuais antes de continuar.';
    case 'PROCUREMENT_LINE_REQUIRED':
      return 'Informe ao menos uma linha.';
    case 'PROCUREMENT_INVALID_STATE':
      return 'O estado atual não permite esta operação. Recarregue os dados para ver o estado vigente.';
    case 'PROCUREMENT_NOT_APPROVED':
      return 'A solicitação precisa estar aprovada para emitir o pedido ao fornecedor.';
    case 'PROCUREMENT_HAS_ORDER':
      return 'Esta solicitação já possui um pedido ao fornecedor e não pode ser cancelada.';
    case 'PROCUREMENT_HAS_RECEIPTS':
      return 'Este pedido já possui recebimentos e não pode ser cancelado.';
    case 'PROCUREMENT_OVER_RECEIPT':
      return 'A quantidade recebida ultrapassa o saldo a receber do pedido.';
    case 'PROCUREMENT_DUPLICATE_ORDER':
      return 'Esta solicitação aprovada já gerou um pedido ao fornecedor.';
    case 'SUPPLIER_INVOICE_DUPLICATE':
      return 'Já existe nota do fornecedor com este número ou vinculada a este recebimento.';
    case 'SUPPLIER_INVOICE_AMOUNT_MISMATCH':
      return 'O valor informado da nota não confere com o pedido ou recebimento vinculado.';
    case 'THREE_WAY_MATCH_NOT_FOUND':
      return 'Conferência tripla não encontrada.';
    case 'APPROVAL_MATRIX_SELF_APPROVAL':
    case 'AUTHZ_SOD_DUTY_CONFLICT':
      return 'A aprovação foi recusada pela segregação de funções.';
    default:
      if (status === 0) {
        return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      }
      if (status === 403) {
        return 'Você não tem permissão para esta operação de compra.';
      }
      return 'Não foi possível concluir a operação de compra.';
  }
}
