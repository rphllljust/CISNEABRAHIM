import { Injectable } from '@nestjs/common';
import type { NotificationChannel } from '../domain/notification-channel';
import type { NotificationChannelProvider } from '../ports/notification-channel.port';

@Injectable()
export class NotificationChannelRegistry {
  private readonly providers = new Map<NotificationChannel, NotificationChannelProvider>();

  register(provider: NotificationChannelProvider): void {
    this.providers.set(provider.channel, provider);
  }

  get(channel: NotificationChannel): NotificationChannelProvider {
    const provider = this.providers.get(channel);
    if (!provider) {
      throw new Error(`NOTIFICATION_CHANNEL_PROVIDER_NOT_REGISTERED:${channel}`);
    }
    return provider;
  }

  listRegistered(): NotificationChannel[] {
    return [...this.providers.keys()];
  }
}
