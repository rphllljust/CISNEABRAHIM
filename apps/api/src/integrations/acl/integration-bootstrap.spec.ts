import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { INTEGRATION_NOT_CONFIGURED_CODE } from './domain/integration-not-configured';
import { ERP_PROVIDER } from './ports/erp-provider.port';
import type { ERPProvider } from './ports/erp-provider.port';
import { TRACKING_PROVIDER } from './ports/tracking-provider.port';
import type { TrackingProvider } from './ports/tracking-provider.port';
import { StubErpProvider } from './adapters/stub/stub-erp.provider';
import { StubFiscalProvider } from './adapters/stub/stub-fiscal.provider';
import { StubNotificationProvider } from './adapters/stub/stub-notification.provider';
import { StubTrackingProvider } from './adapters/stub/stub-tracking.provider';
import {
  UnconfiguredErpProvider,
  UnconfiguredFiscalProvider,
  UnconfiguredNotificationProvider,
} from './adapters/unconfigured/unconfigured-erp.provider';
import { UnconfiguredTrackingProvider } from './adapters/unconfigured/unconfigured-tracking.provider';
import { IntegrationsAclModule } from './integrations-acl.module';
import { IntegrationAvailabilityService } from './services/integration-availability.service';
import { toSafeIntegrationUserMessage } from './services/integration-safe-error';
import { FISCAL_PROVIDER } from './ports/fiscal-provider.port';
import type { FiscalProvider } from './ports/fiscal-provider.port';
import { NOTIFICATION_PROVIDER } from './ports/notification-provider.port';
import type { NotificationProvider } from './ports/notification-provider.port';

describe('integration production bootstrap', () => {
  function clearIntegrationEnv(): void {
    delete process.env['ERP_INTEGRATION_CONFIGURED'];
    delete process.env['ERP_PROVIDER_ID'];
    delete process.env['ERP_API_BASE_URL'];
    delete process.env['TRACKING_INTEGRATION_CONFIGURED'];
    delete process.env['TRACKING_PROVIDER_ID'];
    delete process.env['TRACKING_API_BASE_URL'];
  }

  it('bootstraps AppModule without ERP or tracking configuration', async () => {
    clearIntegrationEnv();
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(module).toBeDefined();
    await module.close();
  });

  it('bootstraps IntegrationsAclModule with unconfigured ERP and tracking providers', async () => {
    clearIntegrationEnv();
    const module = await Test.createTestingModule({
      imports: [IntegrationsAclModule],
    }).compile();

    const erp = module.get<ERPProvider>(ERP_PROVIDER);
    const tracking = module.get<TrackingProvider>(TRACKING_PROVIDER);
    const fiscal = module.get<FiscalProvider>(FISCAL_PROVIDER);
    const notification = module.get<NotificationProvider>(NOTIFICATION_PROVIDER);
    const availability = module.get(IntegrationAvailabilityService);

    expect(erp).toBeInstanceOf(UnconfiguredErpProvider);
    expect(tracking).toBeInstanceOf(UnconfiguredTrackingProvider);
    expect(fiscal).toBeInstanceOf(UnconfiguredFiscalProvider);
    expect(notification).toBeInstanceOf(UnconfiguredNotificationProvider);
    expect(erp).not.toBeInstanceOf(StubErpProvider);
    expect(tracking).not.toBeInstanceOf(StubTrackingProvider);
    expect(fiscal).not.toBeInstanceOf(StubFiscalProvider);
    expect(notification).not.toBeInstanceOf(StubNotificationProvider);
    expect(availability.erp()).toEqual({ configured: false, enabled: false });
    expect(availability.tracking()).toEqual({ configured: false, enabled: false });

    await module.close();
  });

  it('returns INTEGRATION_NOT_CONFIGURED for explicit ERP usage', async () => {
    clearIntegrationEnv();
    const module = await Test.createTestingModule({
      imports: [IntegrationsAclModule],
    }).compile();
    const erp = module.get<ERPProvider>(ERP_PROVIDER);

    await expect(erp.fetchCustomer({ externalCustomerId: 'x' })).rejects.toMatchObject({
      message: INTEGRATION_NOT_CONFIGURED_CODE,
    });

    try {
      await erp.fetchCustomer({ externalCustomerId: 'x' });
      expect.unreachable('expected ERP fetch to fail');
    } catch (error) {
      expect(toSafeIntegrationUserMessage(error)).toBe(INTEGRATION_NOT_CONFIGURED_CODE);
    }

    await module.close();
  });

  it('returns INTEGRATION_NOT_CONFIGURED for explicit tracking usage', async () => {
    clearIntegrationEnv();
    const module = await Test.createTestingModule({
      imports: [IntegrationsAclModule],
    }).compile();
    const tracking = module.get<TrackingProvider>(TRACKING_PROVIDER);

    await expect(tracking.fetchStatus({ trackingCode: 'x' })).rejects.toMatchObject({
      message: INTEGRATION_NOT_CONFIGURED_CODE,
    });

    await module.close();
  });

  it('returns INTEGRATION_NOT_CONFIGURED for explicit fiscal usage', async () => {
    clearIntegrationEnv();
    const module = await Test.createTestingModule({
      imports: [IntegrationsAclModule],
    }).compile();
    const fiscal = module.get<FiscalProvider>(FISCAL_PROVIDER);

    await expect(
      fiscal.issueDocument({
        billingDocumentId: 'bill-1',
        customerTaxId: '11222333000181',
        amountCents: 10000,
        currency: 'BRL',
        idempotencyKey: 'idem-1',
      }),
    ).rejects.toMatchObject({
      message: INTEGRATION_NOT_CONFIGURED_CODE,
    });

    await module.close();
  });

  it('returns INTEGRATION_NOT_CONFIGURED for explicit notification provider usage', async () => {
    clearIntegrationEnv();
    const module = await Test.createTestingModule({
      imports: [IntegrationsAclModule],
    }).compile();
    const notification = module.get<NotificationProvider>(NOTIFICATION_PROVIDER);

    await expect(
      notification.dispatch({
        channel: 'email',
        recipient: 'user@example.com',
        templateKey: 'test',
        variables: {},
        idempotencyKey: 'idem-1',
      }),
    ).rejects.toMatchObject({
      message: INTEGRATION_NOT_CONFIGURED_CODE,
    });

    await module.close();
  });

  it('allows TEST_ONLY stub providers in isolated test modules', async () => {
    const module = await Test.createTestingModule({
      providers: [
        StubErpProvider,
        {
          provide: ERP_PROVIDER,
          useExisting: StubErpProvider,
        },
      ],
    }).compile();

    const erp = module.get<ERPProvider>(ERP_PROVIDER);
    expect(erp).toBeInstanceOf(StubErpProvider);
    await expect(erp.fetchCustomer({ externalCustomerId: 'x' })).rejects.toBeDefined();

    await module.close();
  });
});
