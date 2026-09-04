import { AccessAdminErrorCodes } from '../types';

/**
 * Mapa de mensagens em português para os códigos de erro conhecidos da API
 * de administração de acesso. Espelha o padrão de `finance-error-messages.ts`.
 */
export function mapAccessAdminErrorToMessage(code: string | undefined, status: number): string {
  switch (code) {
    case AccessAdminErrorCodes.DENIED:
      return 'Você não tem permissão para esta operação de administração de acesso.';
    case AccessAdminErrorCodes.NOT_FOUND:
      return 'Registro de administração de acesso não encontrado.';
    case AccessAdminErrorCodes.CONFLICT:
      return 'A operação conflita com o estado atual dos registros de acesso.';
    case AccessAdminErrorCodes.VERSION_CONFLICT:
      return 'A role foi alterada por outra sessão. Recarregue os dados atuais antes de continuar.';
    case AccessAdminErrorCodes.SELF_ESCALATION:
      return 'O servidor recusou a operação: você não pode conceder a si mesmo um acesso que não possui.';
    case AccessAdminErrorCodes.ESCALATION:
      return 'O servidor recusou a operação por elevar privilégios acima do permitido.';
    case AccessAdminErrorCodes.SOD_CONFLICT:
      return 'O servidor recusou a operação por conflito de segregação de funções (SoD).';
    case AccessAdminErrorCodes.VALIDATION_FAILED:
      return 'Os dados informados foram recusados pelo servidor.';
    default:
      if (status === 0) {
        return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      }
      if (status === 403) {
        return 'Você não tem permissão para esta operação de administração de acesso.';
      }
      return 'Não foi possível concluir a operação de administração de acesso.';
  }
}
