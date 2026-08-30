import { Injectable } from '@nestjs/common';
import type { NotificationChannel } from '../domain/notification-channel';
import { NOTIFICATION_CHANNELS } from '../domain/notification-channel';
import type { NotificationChannelCapabilities } from '../config/notification-channel.config';

const SAFE_TEMPLATE_VARIABLE_KEYS = new Set(['schemaVersion', 'intentKey', 'aggregateType']);

export type NotificationIntentContext = {
  intentKey: string;
  audienceScope: string;
  templateKey: string;
  payload: Record<string, unknown>;
  aggregateType?: string;
};

@Injectable()
export class NotificationTemplateService {
  buildMinimalVariables(intent: NotificationIntentContext): Record<string, string> {
    const variables: Record<string, string> = {
      templateKey: intent.templateKey,
      intentKey: intent.intentKey,
    };

    if (intent.aggregateType) {
      variables['aggregateType'] = intent.aggregateType;
    }

    for (const [key, value] of Object.entries(intent.payload)) {
      if (!SAFE_TEMPLATE_VARIABLE_KEYS.has(key)) {
        continue;
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        variables[key] = String(value);
      }
    }

    return variables;
  }

  resolveRecipientRef(channel: NotificationChannel, intent: NotificationIntentContext): string {
    if (channel === NOTIFICATION_CHANNELS.InApp) {
      return `audience:${intent.audienceScope}`;
    }
    if (channel === NOTIFICATION_CHANNELS.Email) {
      const email = intent.payload['recipientEmail'];
      if (typeof email === 'string' && email.trim().length > 0) {
        return email.trim();
      }
      return `audience:${intent.audienceScope}:email`;
    }
    if (channel === NOTIFICATION_CHANNELS.Whatsapp) {
      const phone = intent.payload['recipientPhone'];
      if (typeof phone === 'string' && phone.trim().length > 0) {
        return phone.trim();
      }
      return `audience:${intent.audienceScope}:whatsapp`;
    }
    return `audience:${intent.audienceScope}`;
  }

  isValidRecipient(channel: NotificationChannel, recipientRef: string): boolean {
    if (recipientRef.trim().length === 0) {
      return false;
    }
    if (channel === NOTIFICATION_CHANNELS.Email) {
      return recipientRef.includes('@');
    }
    if (channel === NOTIFICATION_CHANNELS.Whatsapp) {
      return /^\+?[0-9]{8,15}$/.test(recipientRef);
    }
    return recipientRef.startsWith('audience:');
  }
}

export function resolveEnabledChannels(
  capabilities: NotificationChannelCapabilities,
): NotificationChannel[] {
  const channels: NotificationChannel[] = [];
  if (capabilities.inApp.configured && capabilities.inApp.enabled) {
    channels.push(NOTIFICATION_CHANNELS.InApp);
  }
  if (capabilities.email.configured && capabilities.email.enabled) {
    channels.push(NOTIFICATION_CHANNELS.Email);
  }
  if (capabilities.whatsapp.configured && capabilities.whatsapp.enabled) {
    channels.push(NOTIFICATION_CHANNELS.Whatsapp);
  }
  return channels;
}
