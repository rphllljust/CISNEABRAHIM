/**
 * Canais de registro — mantidos distintos por política (Prompt 06/13/14).
 * SECURITY_AUDIT é o único canal implementado neste prompt.
 */
export const AUDIT_CHANNELS = {
  AuditTrail: 'AUDIT_TRAIL',
  DomainHistory: 'DOMAIN_HISTORY',
  SecurityAudit: 'SECURITY_AUDIT',
  TechnicalLog: 'TECHNICAL_LOG',
} as const;

export type AuditChannel = (typeof AUDIT_CHANNELS)[keyof typeof AUDIT_CHANNELS];
