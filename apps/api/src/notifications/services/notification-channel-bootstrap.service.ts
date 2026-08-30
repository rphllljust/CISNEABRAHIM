import { Injectable, OnModuleInit } from '@nestjs/common';
import { InAppNotificationChannelProvider } from '../adapters/in-app/in-app-channel.provider';
import {
  UnconfiguredEmailChannelProvider,
  UnconfiguredWhatsAppChannelProvider,
} from '../adapters/unconfigured/unconfigured-channel.providers';
import { NotificationChannelRegistry } from './notification-channel.registry';

@Injectable()
export class NotificationChannelBootstrapService implements OnModuleInit {
  constructor(
    private readonly registry: NotificationChannelRegistry,
    private readonly inApp: InAppNotificationChannelProvider,
    private readonly email: UnconfiguredEmailChannelProvider,
    private readonly whatsapp: UnconfiguredWhatsAppChannelProvider,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.inApp);
    this.registry.register(this.email);
    this.registry.register(this.whatsapp);
  }
}
