export type NotificationChannelCapability = {
  configured: boolean;
  enabled: boolean;
};

export type NotificationChannelCapabilities = {
  inApp: NotificationChannelCapability;
  email: NotificationChannelCapability;
  whatsapp: NotificationChannelCapability;
};

function readBooleanEnv(name: string): boolean {
  return process.env[name] === 'true';
}

export function isEmailNotificationConfigured(): boolean {
  return (
    readBooleanEnv('EMAIL_NOTIFICATION_CONFIGURED') &&
    typeof process.env['EMAIL_PROVIDER_ID'] === 'string' &&
    process.env['EMAIL_PROVIDER_ID'].length > 0
  );
}

export function isWhatsAppNotificationConfigured(): boolean {
  return (
    readBooleanEnv('WHATSAPP_NOTIFICATION_CONFIGURED') &&
    typeof process.env['WHATSAPP_PROVIDER_ID'] === 'string' &&
    process.env['WHATSAPP_PROVIDER_ID'].length > 0
  );
}

export function loadNotificationChannelCapabilities(): NotificationChannelCapabilities {
  const emailConfigured = isEmailNotificationConfigured();
  const whatsappConfigured = isWhatsAppNotificationConfigured();

  return {
    inApp: {
      configured: true,
      enabled: true,
    },
    email: {
      configured: emailConfigured,
      enabled: emailConfigured && process.env['EMAIL_NOTIFICATION_ENABLED'] !== 'false',
    },
    whatsapp: {
      configured: whatsappConfigured,
      enabled: whatsappConfigured && process.env['WHATSAPP_NOTIFICATION_ENABLED'] !== 'false',
    },
  };
}

export function loadNotificationDispatchTimeoutMs(): number {
  const raw = process.env['NOTIFICATION_DISPATCH_TIMEOUT_MS'];
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 10_000;
}
