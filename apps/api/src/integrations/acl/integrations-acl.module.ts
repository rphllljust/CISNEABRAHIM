import { Module } from '@nestjs/common';
import {
  UnconfiguredErpProvider,
  UnconfiguredFiscalProvider,
  UnconfiguredNotificationProvider,
} from './adapters/unconfigured/unconfigured-erp.provider';
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
    UnconfiguredFiscalProvider,
    UnconfiguredNotificationProvider,
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
      useExisting: UnconfiguredNotificationProvider,
    },
    {
      provide: FISCAL_PROVIDER,
      useExisting: UnconfiguredFiscalProvider,
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
