import { Module } from '@nestjs/common';
import { StubFiscalProvider } from './adapters/stub/stub-fiscal.provider';
import { StubNotificationProvider } from './adapters/stub/stub-notification.provider';
import { UnconfiguredErpProvider } from './adapters/unconfigured/unconfigured-erp.provider';
import { UnconfiguredTrackingProvider } from './adapters/unconfigured/unconfigured-tracking.provider';
import { ERP_PROVIDER } from './ports/erp-provider.port';
import { FISCAL_PROVIDER } from './ports/fiscal-provider.port';
import { NOTIFICATION_PROVIDER } from './ports/notification-provider.port';
import { TRACKING_PROVIDER } from './ports/tracking-provider.port';
import { IntegrationAvailabilityService } from './services/integration-availability.service';

@Module({
  providers: [
    UnconfiguredErpProvider,
    UnconfiguredTrackingProvider,
    StubFiscalProvider,
    StubNotificationProvider,
    IntegrationAvailabilityService,
    {
      provide: ERP_PROVIDER,
      useExisting: UnconfiguredErpProvider,
    },
    {
      provide: TRACKING_PROVIDER,
      useExisting: UnconfiguredTrackingProvider,
    },
    {
      provide: NOTIFICATION_PROVIDER,
      useExisting: StubNotificationProvider,
    },
    {
      provide: FISCAL_PROVIDER,
      useExisting: StubFiscalProvider,
    },
  ],
  exports: [
    ERP_PROVIDER,
    TRACKING_PROVIDER,
    NOTIFICATION_PROVIDER,
    FISCAL_PROVIDER,
    IntegrationAvailabilityService,
  ],
})
export class IntegrationsAclModule {}
