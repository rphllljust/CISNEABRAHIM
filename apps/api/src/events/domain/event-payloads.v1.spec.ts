import { describe, expect, it } from 'vitest';
import { DOMAIN_EVENT_PAYLOAD_VERSION } from './domain-event-type';
import {
  assertAuthorizationIndependentPayload,
  assertDomainEventPayloadVersion,
  buildServiceRequestSubmittedPayloadV1,
} from './event-payloads.v1';

describe('domain event payloads v1', () => {
  it('builds versioned payloads', () => {
    const payload = buildServiceRequestSubmittedPayloadV1({
      serviceRequestId: '11111111-1111-4111-8111-111111111111',
      unitId: 'unit-a',
      clientId: null,
      submittedAt: '2026-08-29T12:00:00.000Z',
    });
    expect(payload.schemaVersion).toBe(DOMAIN_EVENT_PAYLOAD_VERSION);
    expect(payload.serviceRequestId).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('rejects unsupported payload versions', () => {
    expect(() => assertDomainEventPayloadVersion(99)).toThrow(/UNSUPPORTED_DOMAIN_EVENT_PAYLOAD_VERSION/);
  });

  it('rejects authorization-sensitive payload fields', () => {
    expect(() =>
      assertAuthorizationIndependentPayload({
        serviceRequestId: '11111111-1111-4111-8111-111111111111',
        actorIdentityId: 'secret',
      }),
    ).toThrow(/AUTHORIZATION_SENSITIVE_PAYLOAD_FIELD/);
  });

  it('accepts authorization-independent business facts', () => {
    expect(() =>
      assertAuthorizationIndependentPayload(
        buildServiceRequestSubmittedPayloadV1({
          serviceRequestId: '11111111-1111-4111-8111-111111111111',
          unitId: 'unit-a',
          clientId: '22222222-2222-4222-8222-222222222222',
          submittedAt: '2026-08-29T12:00:00.000Z',
        }) as unknown as Record<string, unknown>,
      ),
    ).not.toThrow();
  });
});
