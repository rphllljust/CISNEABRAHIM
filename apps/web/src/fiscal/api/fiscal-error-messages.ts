export function mapFiscalErrorToMessage(code: string | undefined, status: number): string {
  switch (code) {
    case 'FISCAL_DENIED':
      return 'Você não tem permissão para esta operação fiscal.';
    case 'FISCAL_NOT_FOUND':
    case 'FISCAL_TAX_CALCULATION_NOT_FOUND':
      return 'Documento ou apuração fiscal não encontrado.';
    case 'FISCAL_VERSION_CONFLICT':
      return 'A versão do documento mudou. Recarregue os dados atuais antes de continuar.';
    case 'FISCAL_DOCUMENT_IMMUTABLE':
      return 'O documento fiscal não aceita esta alteração no estado atual.';
    case 'FISCAL_INVALID_TRANSITION':
      return 'A transição de status foi recusada pelo servidor.';
    case 'FISCAL_DUPLICATE_SUBMISSION':
      return 'Esta submissão já foi processada.';
    case 'FISCAL_GATEWAY_NOT_CONFIGURED':
      return 'O gateway fiscal não está configurado.';
    case 'FISCAL_TAX_RULE_NOT_CONFIGURED':
      return 'A regra tributária não está configurada para o contexto informado.';
    default:
      if (status === 0) {
        return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      }
      if (status === 403) {
        return 'Você não tem permissão para esta operação fiscal.';
      }
      return 'Não foi possível concluir a operação fiscal.';
  }
}
