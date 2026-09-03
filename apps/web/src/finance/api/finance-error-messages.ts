export function mapFinanceErrorToMessage(code: string | undefined, status: number): string {
  switch (code) {
    case 'FINANCE_DENIED':
      return 'Você não tem permissão para esta operação financeira.';
    case 'FINANCE_NOT_FOUND':
    case 'FINANCE_PAYABLE_NOT_FOUND':
    case 'FINANCE_TREASURY_ACCOUNT_NOT_FOUND':
    case 'FINANCE_BANK_RECON_NOT_FOUND':
      return 'Registro financeiro não encontrado.';
    case 'FINANCE_VERSION_CONFLICT':
      return 'A versão do registro mudou. Recarregue os dados atuais antes de continuar.';
    case 'FINANCE_RECEIVABLE_CANCELLED':
    case 'FINANCE_PAYABLE_CANCELLED':
      return 'O título está cancelado e não aceita esta operação.';
    case 'FINANCE_RECEIVABLE_OVERPAYMENT':
    case 'FINANCE_PAYABLE_OVERPAYMENT':
    case 'FINANCE_INVALID_SETTLEMENT_AMOUNT':
    case 'FINANCE_INVALID_PAYMENT_AMOUNT':
      return 'O valor informado foi recusado pelo servidor.';
    case 'FINANCE_TREASURY_ACCOUNT_CLOSED':
      return 'A conta financeira está encerrada.';
    case 'FINANCE_TREASURY_INSUFFICIENT_BALANCE':
      return 'Saldo insuficiente na conta (decisão do servidor).';
    case 'FINANCE_BANK_IMPORT_LAYOUT_NOT_DOCUMENTED':
      return 'Este layout de arquivo bancário não está documentado. Use o formato autorizado.';
    case 'FINANCE_BANK_IMPORT_INVALID_FILE':
    case 'FINANCE_BANK_IMPORT_MALFORMED':
    case 'FINANCE_BANK_IMPORT_EMPTY':
      return 'O arquivo de extrato foi recusado pelo servidor.';
    case 'FINANCE_BANK_RECON_CONFIRMED_IMMUTABLE':
      return 'A conciliação confirmada não pode ser alterada desta forma.';
    default:
      if (status === 0) {
        return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      }
      if (status === 403) {
        return 'Você não tem permissão para esta operação financeira.';
      }
      return 'Não foi possível concluir a operação financeira.';
  }
}
