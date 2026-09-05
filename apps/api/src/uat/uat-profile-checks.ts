import { ADDRESS_PURPOSES, CONTACT_PURPOSES } from '../clients/domain/client-status';
import { AuthzHttpException } from '../authorization/errors/authz-http.exception';
import type { BillingAccessService } from '../billing/services/billing-access.service';
import type { ClientAccessService } from '../clients/services/client-access.service';
import type { ServiceOrderExecutionAccessService } from '../service-orders/services/service-order-execution-access.service';
import type { ServiceOrdersAccessService } from '../service-orders/services/service-orders-access.service';
import type { UatActor } from './uat-vertical-runner';
import type { UatProfileCheck, UatProfileId } from './uat-types';

async function expectDenied(run: () => Promise<unknown>): Promise<boolean> {
  try {
    await run();
    return false;
  } catch (error) {
    return error instanceof AuthzHttpException || error instanceof Error;
  }
}

async function expectAllowed(run: () => Promise<unknown>): Promise<boolean> {
  try {
    await run();
    return true;
  } catch {
    return false;
  }
}

export async function evaluateUatProfileChecks(
  input: {
    controlAdmin: UatActor;
    executor: UatActor;
    finance: UatActor;
    releasedServiceOrderId: string;
    billableServiceOrderId: string;
    clientAccess: ClientAccessService;
    serviceOrdersAccess: ServiceOrdersAccessService;
    executionAccess: ServiceOrderExecutionAccessService;
    billingAccess: BillingAccessService;
    approvedMeasurementId: string;
  },
): Promise<UatProfileCheck[]> {
  const definitions = [
    {
      profileId: 'executor' as UatProfileId,
      action: 'client:create',
      expected: 'DENY' as const,
      run: () =>
        expectDenied(() =>
          input.clientAccess.create(input.executor, {
            legalName: 'Executor Should Not Create LTDA',
            tradeName: 'Denied',
            taxId: '11222333000181',
            contacts: [{ name: 'X', purpose: CONTACT_PURPOSES.Operational, phone: '69999990001' }],
            addresses: [
              {
                purpose: ADDRESS_PURPOSES.Billing,
                street: 'Rua X',
                number: '1',
                city: 'PVH',
                state: 'RO',
                postalCode: '76800000',
                country: 'BR',
              },
            ],
          }),
        ),
    },
    {
      profileId: 'executor' as UatProfileId,
      action: 'service-order:read',
      expected: 'ALLOW' as const,
      run: () =>
        expectAllowed(() =>
          input.serviceOrdersAccess.getById(input.executor, input.billableServiceOrderId),
        ),
    },
    {
      profileId: 'executor' as UatProfileId,
      action: 'billing:prepare',
      expected: 'DENY' as const,
      run: () =>
        expectDenied(() =>
          input.billingAccess.prepare(input.executor, input.billableServiceOrderId, {
            measurementId: input.approvedMeasurementId,
            paymentTerms: '30 DDL',
          }),
        ),
    },
    {
      profileId: 'finance' as UatProfileId,
      action: 'billing:prepare',
      expected: 'DENY' as const,
      run: () =>
        expectDenied(() =>
          input.billingAccess.prepare(input.finance, input.billableServiceOrderId, {
            measurementId: input.approvedMeasurementId,
            paymentTerms: '30 DDL',
          }),
        ),
    },
    {
      profileId: 'control_admin' as UatProfileId,
      action: 'billing:prepare',
      expected: 'ALLOW' as const,
      run: () =>
        expectAllowed(() =>
          input.billingAccess.prepare(input.controlAdmin, input.billableServiceOrderId, {
            measurementId: input.approvedMeasurementId,
            paymentTerms: '30 DDL',
          }),
        ),
    },
    {
      profileId: 'finance' as UatProfileId,
      action: 'execution:start',
      expected: 'DENY' as const,
      run: () =>
        expectDenied(async () => {
          const order = await input.serviceOrdersAccess.getById(
            input.finance,
            input.releasedServiceOrderId,
          );
          await input.executionAccess.start(input.finance, input.releasedServiceOrderId, {
            rowVersion: order.rowVersion,
          });
        }),
    },
    {
      profileId: 'control_admin' as UatProfileId,
      action: 'client:create',
      expected: 'ALLOW' as const,
      run: () =>
        expectAllowed(() =>
          input.clientAccess.create(input.controlAdmin, {
            legalName: 'Admin Can Create LTDA',
            tradeName: 'Admin OK',
            taxId: '00000000000191',
            contacts: [{ name: 'Admin', purpose: CONTACT_PURPOSES.Operational, phone: '69999990002' }],
            addresses: [
              {
                purpose: ADDRESS_PURPOSES.Billing,
                street: 'Rua Admin',
                number: '2',
                city: 'PVH',
                state: 'RO',
                postalCode: '76800000',
                country: 'BR',
              },
            ],
          }),
        ),
    },
  ];

  const results: UatProfileCheck[] = [];
  for (const definition of definitions) {
    const ok = await definition.run();
    const actual: UatProfileCheck['actual'] = ok
      ? definition.expected
      : definition.expected === 'ALLOW'
        ? 'DENY'
        : 'ALLOW';
    results.push({
      profileId: definition.profileId,
      action: definition.action,
      expected: definition.expected,
      actual,
      passed: ok,
    });
  }
  return results;
}
