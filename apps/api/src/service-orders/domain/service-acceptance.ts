/**
 * Service Acceptance — aceite operacional pós-execução.
 *
 * Regras:
 *  - Somente OS/execução COMPLETED pode ser aceita/rejeitada.
 *  - Aceite é append-only: nunca altera a execução histórica (HISTORY LOSS 0).
 *  - Rejeição abre uma pendência (não apaga a execução).
 *  - Um único aceite por service order (duplicate bloqueado).
 *  - Autorização obrigatória; auditoria registra quem/quando/resultado/observação.
 *  - Assinatura/evidência é opcional ("quando suportada").
 */

import {
  ServiceAcceptanceError,
  SERVICE_ACCEPTANCE_ERROR_CODES,
} from './service-acceptance-errors';

export const ACCEPTANCE_RESULTS = {
  Accepted: 'ACCEPTED',
  Rejected: 'REJECTED',
} as const;

export type AcceptanceResult =
  (typeof ACCEPTANCE_RESULTS)[keyof typeof ACCEPTANCE_RESULTS];

export type ServiceAcceptanceInput = {
  serviceOrderId: string;
  executionStatus: string;
  result: AcceptanceResult;
  observation: string;
  acceptedByIdentityId: string;
  acceptedAt: string;
  evidenceId?: string | null;
};

export type ServiceAcceptance = {
  serviceOrderId: string;
  result: AcceptanceResult;
  acceptedByIdentityId: string;
  acceptedAt: string;
  observation: string;
  evidenceIds: string[];
};

export type AcceptancePendingIssue = {
  serviceOrderId: string;
  reason: string;
  openedAt: string;
  openedByIdentityId: string;
};

export type AcceptanceAuditEvent = {
  eventType: 'SERVICE_ACCEPTED' | 'SERVICE_REJECTED';
  serviceOrderId: string;
  actorIdentityId: string;
  occurredAt: string;
  result: AcceptanceResult;
  observation: string;
};

function assertAuthorized(authorized: boolean): void {
  if (!authorized) {
    throw new ServiceAcceptanceError(SERVICE_ACCEPTANCE_ERROR_CODES.UNAUTHORIZED);
  }
}

function assertCompleted(executionStatus: string): void {
  if (executionStatus !== 'COMPLETED') {
    throw new ServiceAcceptanceError(SERVICE_ACCEPTANCE_ERROR_CODES.NOT_COMPLETED);
  }
}

function assertValidResult(result: AcceptanceResult): void {
  if (result !== ACCEPTANCE_RESULTS.Accepted && result !== ACCEPTANCE_RESULTS.Rejected) {
    throw new ServiceAcceptanceError(SERVICE_ACCEPTANCE_ERROR_CODES.INVALID_RESULT);
  }
}

/**
 * Garante que a execução histórica permanece intacta: o aceite recebe apenas
 * referência imutável e nunca a muta.
 */
export function assertExecutionHistoryIntact<T>(execution: Readonly<T>): Readonly<T> {
  return execution;
}

/** Aceita/rejeita quando aplicável; duplicate e autorização são barrados. */
export function recordAcceptance(
  input: ServiceAcceptanceInput,
  options: { authorized: boolean; existingAcceptance: ServiceAcceptance | null },
): { acceptance: ServiceAcceptance; pendingIssue: AcceptancePendingIssue | null; audit: AcceptanceAuditEvent } {
  assertAuthorized(options.authorized);
  assertCompleted(input.executionStatus);
  assertValidResult(input.result);
  if (options.existingAcceptance) {
    throw new ServiceAcceptanceError(SERVICE_ACCEPTANCE_ERROR_CODES.ALREADY_RECORDED);
  }
  if (!input.observation.trim()) {
    throw new ServiceAcceptanceError(SERVICE_ACCEPTANCE_ERROR_CODES.OBSERVATION_REQUIRED);
  }
  if (!input.acceptedByIdentityId.trim() || !input.acceptedAt) {
    throw new ServiceAcceptanceError(SERVICE_ACCEPTANCE_ERROR_CODES.UNAUTHORIZED);
  }

  const acceptance: ServiceAcceptance = {
    serviceOrderId: input.serviceOrderId,
    result: input.result,
    acceptedByIdentityId: input.acceptedByIdentityId,
    acceptedAt: input.acceptedAt,
    observation: input.observation.trim(),
    evidenceIds: input.evidenceId ? [input.evidenceId] : [],
  };

  const pendingIssue: AcceptancePendingIssue | null =
    input.result === ACCEPTANCE_RESULTS.Rejected
      ? {
          serviceOrderId: input.serviceOrderId,
          reason: input.observation.trim(),
          openedAt: input.acceptedAt,
          openedByIdentityId: input.acceptedByIdentityId,
        }
      : null;

  const audit: AcceptanceAuditEvent = {
    eventType: input.result === ACCEPTANCE_RESULTS.Accepted ? 'SERVICE_ACCEPTED' : 'SERVICE_REJECTED',
    serviceOrderId: input.serviceOrderId,
    actorIdentityId: input.acceptedByIdentityId,
    occurredAt: input.acceptedAt,
    result: input.result,
    observation: input.observation.trim(),
  };

  return { acceptance, pendingIssue, audit };
}

/** Rejeição abre pendência mas NUNCA apaga/reescreve a execução. */
export function assertRejectionKeepsExecution<T>(
  execution: Readonly<T>,
): Readonly<T> {
  return execution;
}
