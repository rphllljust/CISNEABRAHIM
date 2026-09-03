export function mapAccountingErrorToMessage(code: string | undefined, status: number): string {
  switch (code) {
    case 'ACCOUNTING_DENIED':
      return 'Você não tem permissão para esta operação contábil.';
    case 'ACCOUNTING_NOT_FOUND':
    case 'ACCOUNTING_CHART_NOT_FOUND':
    case 'ACCOUNTING_PERIOD_NOT_FOUND':
      return 'Registro contábil não encontrado.';
    case 'ACCOUNTING_VERSION_CONFLICT':
      return 'A versão do lançamento ou período mudou. Recarregue os dados atuais antes de continuar.';
    case 'ACCOUNTING_PERIOD_CLOSED':
      return 'O período está fechado. Novos lançamentos foram recusados pelo servidor.';
    case 'ACCOUNTING_PERIOD_HAS_DRAFTS':
      return 'O fechamento foi recusado porque existem rascunhos no período.';
    case 'ACCOUNTING_UNBALANCED_TRIAL_BALANCE':
      return 'O fechamento foi recusado: o balancete informado pelo servidor está desbalanceado.';
    case 'ACCOUNTING_PERIOD_CLOSE_BLOCKED':
      return 'O fechamento foi bloqueado pelas checagens do servidor. O período permanece aberto.';
    case 'REPORT_CLASSIFICATION_INCOMPLETE':
      return 'A classificação contábil está incompleta. O servidor não inventa grupo para DRE ou balanço.';
    case 'ACCOUNTING_UNBALANCED_ENTRY':
      return 'O lançamento está desbalanceado e não pode ser postado.';
    case 'ACCOUNTING_ENTRY_IMMUTABLE':
      return 'O lançamento não aceita esta alteração no estado atual.';
    case 'ACCOUNTING_ALREADY_REVERSED':
      return 'Este lançamento já foi estornado.';
    default:
      if (status === 0) {
        return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      }
      if (status === 403) {
        return 'Você não tem permissão para esta operação contábil.';
      }
      return 'Não foi possível concluir a operação contábil.';
  }
}
