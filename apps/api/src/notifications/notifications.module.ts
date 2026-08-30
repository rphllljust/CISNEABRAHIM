import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { InAppNotificationChannelProvider } from './adapters/in-app/in-app-channel.provider';
import {
  UnconfiguredEmailChannelProvider,
  UnconfiguredWhatsAppChannelProvider,
} from './adapters/unconfigured/unconfigured-channel.providers';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationChannelBootstrapService } from './services/notification-channel-bootstrap.service';
import { NotificationChannelRegistry } from './services/notification-channel.registry';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationWebhookService } from './services/notification-webhook.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    NotificationsRepository,
    NotificationChannelRegistry,
    NotificationChannelBootstrapService,
    NotificationTemplateService,
    NotificationDeliveryService,
    NotificationWebhookService,
    InAppNotificationChannelProvider,
    UnconfiguredEmailChannelProvider,
    UnconfiguredWhatsAppChannelProvider,
  ],
  exports: [
    NotificationsRepository,
    NotificationChannelRegistry,
    NotificationTemplateService,
    NotificationDeliveryService,
    NotificationWebhookService,
  ],
})
export class NotificationsModule {}
