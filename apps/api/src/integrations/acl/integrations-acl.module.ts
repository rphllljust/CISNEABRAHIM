import { Module } from '@nestjs/common';
import { StubErpProvider } from './adapters/stub/stub-erp.provider';
import { StubFiscalProvider } from './adapters/stub/stub-fiscal.provider';
import { StubNotificationProvider } from './adapters/stub/stub-notification.provider';
import { StubTrackingProvider } from './adapters/stub/stub-tracking.provider';
import { ERP_PROVIDER } from './ports/erp-provider.port';
import { FISCAL_PROVIDER } from './ports/fiscal-provider.port';
import { NOTIFICATION_PROVIDER } from './ports/notification-provider.port';
import { TRACKING_PROVIDER } from './ports/tracking-provider.port';

@Module({
  providers: [
    StubErpProvider,
    StubTrackingProvider,
    StubNotificationProvider,
    StubFiscalProvider,
    {
      provide: ERP_PROVIDER,
      useExisting: StubErpProvider,
    },
    {
      provide: TRACKING_PROVIDER,
      useExisting: StubTrackingProvider,
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
  exports: [ERP_PROVIDER, TRACKING_PROVIDER, NOTIFICATION_PROVIDER, FISCAL_PROVIDER],
})
export class IntegrationsAclModule {}
