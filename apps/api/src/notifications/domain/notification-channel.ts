export const NOTIFICATION_CHANNELS = {
  InApp: 'IN_APP',
  Email: 'EMAIL',
  Whatsapp: 'WHATSAPP',
} as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

export const NOTIFICATION_STATUS = {
  Pending: 'PENDING',
  Sent: 'SENT',
  Delivered: 'DELIVERED',
  Failed: 'FAILED',
} as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

export const DELIVERY_ATTEMPT_STATUS = {
  Pending: 'PENDING',
  Sent: 'SENT',
  Delivered: 'DELIVERED',
  Failed: 'FAILED',
} as const;

export type DeliveryAttemptStatus =
  (typeof DELIVERY_ATTEMPT_STATUS)[keyof typeof DELIVERY_ATTEMPT_STATUS];
