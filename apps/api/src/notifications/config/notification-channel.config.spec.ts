import { afterEach, describe, expect, it } from 'vitest';
import {
  isEmailNotificationConfigured,
  isWhatsAppNotificationConfigured,
  loadNotificationChannelCapabilities,
} from '../config/notification-channel.config';

describe('notification channel config', () => {
  afterEach(() => {
    delete process.env['EMAIL_NOTIFICATION_CONFIGURED'];
    delete process.env['EMAIL_PROVIDER_ID'];
    delete process.env['WHATSAPP_NOTIFICATION_CONFIGURED'];
    delete process.env['WHATSAPP_PROVIDER_ID'];
  });

  it('always enables IN_APP as confirmed internal provider', () => {
    const capabilities = loadNotificationChannelCapabilities();
    expect(capabilities.inApp).toEqual({ configured: true, enabled: true });
  });

  it('requires explicit configuration for EMAIL', () => {
    expect(isEmailNotificationConfigured()).toBe(false);
    process.env['EMAIL_NOTIFICATION_CONFIGURED'] = 'true';
    process.env['EMAIL_PROVIDER_ID'] = 'smtp';
    expect(isEmailNotificationConfigured()).toBe(true);
  });

  it('requires explicit configuration for WHATSAPP', () => {
    expect(isWhatsAppNotificationConfigured()).toBe(false);
    process.env['WHATSAPP_NOTIFICATION_CONFIGURED'] = 'true';
    process.env['WHATSAPP_PROVIDER_ID'] = 'meta';
    expect(isWhatsAppNotificationConfigured()).toBe(true);
  });
});
