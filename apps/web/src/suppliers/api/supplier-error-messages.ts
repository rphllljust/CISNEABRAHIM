export function mapSupplierErrorToMessage(code: string | undefined, status: number): string {
  switch (code) {
    case 'SUPPLIER_DENIED':
      return 'Você não tem permissão para esta operação de fornecedor.';
    case 'SUPPLIER_NOT_FOUND':
      return 'Fornecedor não encontrado.';
    case 'SUPPLIER_VERSION_CONFLICT':
      return 'A versão do fornecedor mudou. Recarregue os dados atuais antes de continuar.';
    case 'SUPPLIER_TAX_ID_INVALID':
      return 'O CNPJ informado foi recusado pelo servidor.';
    case 'SUPPLIER_CONTACT_REQUIRED':
      return 'Informe um contato operacional com e-mail ou telefone.';
    case 'AUTHZ_SOD_DUTY_CONFLICT':
    case 'APPROVAL_MATRIX_SELF_APPROVAL':
      return 'A ativação foi recusada pela segregação de funções.';
    default:
      if (status === 0) {
        return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      }
      if (status === 403) {
        return 'Você não tem permissão para esta operação de fornecedor.';
      }
      return 'Não foi possível concluir a operação de fornecedor.';
  }
}
