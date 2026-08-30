import { PROPOSAL_ERROR_CODES, type ProposalErrorCode } from '../types/proposal.types';

export const PROPOSAL_VERSION_CONFLICT_MESSAGE =
  'Esta proposta foi alterada por outro usuário. Recarregue os dados antes de tentar novamente.';

export function mapProposalErrorToMessage(
  code: ProposalErrorCode | undefined,
  status: number,
): string {
  switch (code) {
    case PROPOSAL_ERROR_CODES.VERSION_CONFLICT:
      return PROPOSAL_VERSION_CONFLICT_MESSAGE;
    case PROPOSAL_ERROR_CODES.INVALID_STATE:
      return 'Esta operação não é permitida para o status atual da proposta.';
    case PROPOSAL_ERROR_CODES.VALIDATION_FAILED:
      return 'Verifique os dados informados e tente novamente.';
    case PROPOSAL_ERROR_CODES.NOT_FOUND:
    case PROPOSAL_ERROR_CODES.VERSION_NOT_FOUND:
      return 'Proposta não encontrada.';
    case PROPOSAL_ERROR_CODES.DENIED:
      return 'Você não tem permissão para esta operação.';
    case PROPOSAL_ERROR_CODES.CLIENT_INACTIVE:
      return 'O cliente selecionado está inativo.';
    case PROPOSAL_ERROR_CODES.UNIT_NOT_REGISTERED:
      return 'A unidade operacional informada não está registrada.';
    case PROPOSAL_ERROR_CODES.DRAFT_EXISTS:
      return 'Já existe uma versão em rascunho para esta proposta.';
    case PROPOSAL_ERROR_CODES.REVISION_NOT_ALLOWED:
      return 'Não é possível criar nova versão a partir do status atual.';
    default:
      if (status === 403) {
        return 'Você não tem permissão para esta operação.';
      }
      if (status === 404) {
        return 'Proposta não encontrada.';
      }
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
