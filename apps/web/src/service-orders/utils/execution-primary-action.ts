import { SERVICE_ORDER_STATUSES } from '../types/service-order.types';

export type PrimaryActionKind = 'start' | 'resume' | 'record' | 'complete' | 'none';

export type PrimaryAction = {
  kind: PrimaryActionKind;
  label: string;
  ariaLabel: string;
  disabledReason?: string;
};

export function resolvePrimaryAction(input: {
  status: string;
  requirementsComplete: boolean;
  canMutate: boolean;
}): PrimaryAction {
  const { status, requirementsComplete, canMutate } = input;

  if (!canMutate) {
    return {
      kind: 'none',
      label: 'Somente leitura',
      ariaLabel: 'Execução em modo somente leitura',
      disabledReason: 'Sem permissão para alterar esta ordem de serviço.',
    };
  }

  if (status === SERVICE_ORDER_STATUSES.Released) {
    return {
      kind: 'start',
      label: 'Confirmar e começar',
      ariaLabel: 'Confirmar e começar execução da ordem de serviço',
    };
  }

  if (status === SERVICE_ORDER_STATUSES.Paused) {
    return {
      kind: 'resume',
      label: 'Retomar execução',
      ariaLabel: 'Retomar execução da ordem de serviço',
    };
  }

  if (status === SERVICE_ORDER_STATUSES.InExecution) {
    if (requirementsComplete) {
      return {
        kind: 'complete',
        label: 'Concluir OS',
        ariaLabel: 'Concluir ordem de serviço',
      };
    }
    return {
      kind: 'record',
      label: 'Registrar atividade',
      ariaLabel: 'Registrar atividade de execução',
    };
  }

  if (status === SERVICE_ORDER_STATUSES.Completed) {
    return {
      kind: 'none',
      label: 'OS concluída',
      ariaLabel: 'Ordem de serviço já concluída',
      disabledReason: 'Esta ordem de serviço já foi concluída.',
    };
  }

  return {
    kind: 'none',
    label: 'Indisponível',
    ariaLabel: 'Ação indisponível no estado atual',
    disabledReason: 'A ordem de serviço não está pronta para execução.',
  };
}
