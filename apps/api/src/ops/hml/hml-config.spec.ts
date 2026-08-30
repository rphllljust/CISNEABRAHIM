import { describe, expect, it } from 'vitest';
import {
  assertHmlIsolation,
  assertHmlOutboundSafety,
  loadHmlIntegrationPolicy,
  summarizeHmlConfig,
} from './hml-config';

describe('hml-config', () => {
  it('requires CISNE_ENV=hml and dedicated database naming', () => {
    expect(() => assertHmlIsolation({ CISNE_ENV: 'dev', DATABASE_URL: 'postgresql://u:p@hml-db:5432/cisne_hml' })).toThrow(
      /CISNE_ENV/,
    );
    expect(() =>
      assertHmlIsolation({
        CISNE_ENV: 'hml',
        DATABASE_URL: 'postgresql://u:p@prod-db:5432/cisne_production',
      }),
    ).toThrow(/production/);
    expect(() =>
      assertHmlIsolation({
        CISNE_ENV: 'hml',
        DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/cisne_hml',
        OBJECT_STORAGE_BUCKET: 'cisne-hml-documents',
      }),
    ).not.toThrow();
  });

  it('blocks real outbound email/whatsapp by default in sandbox mode', () => {
    const policy = loadHmlIntegrationPolicy({
      HML_INTEGRATIONS_SANDBOX: 'true',
      EMAIL_NOTIFICATION_CONFIGURED: 'true',
      EMAIL_NOTIFICATION_ENABLED: 'true',
      WHATSAPP_NOTIFICATION_CONFIGURED: 'true',
      WHATSAPP_NOTIFICATION_ENABLED: 'true',
    });
    expect(policy.emailEnabled).toBe(false);
    expect(policy.whatsappEnabled).toBe(false);
    expect(() =>
      assertHmlOutboundSafety({
        HML_INTEGRATIONS_SANDBOX: 'true',
        EMAIL_NOTIFICATION_CONFIGURED: 'true',
        EMAIL_NOTIFICATION_ENABLED: 'true',
      }),
    ).not.toThrow();
  });

  it('summarizes isolated HML resources', () => {
    const summary = summarizeHmlConfig({
      CISNE_ENV: 'hml',
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://cisne_hml:secret@postgres:5432/cisne_hml',
      OBJECT_STORAGE_BUCKET: 'cisne-hml-documents',
      HML_PUBLIC_API_URL: 'https://api-hml.example.invalid',
      HML_PUBLIC_WEB_URL: 'https://hml.example.invalid',
      HML_INTEGRATIONS_SANDBOX: 'true',
    });
    expect(summary.cisneEnv).toBe('hml');
    expect(summary.databaseHost).toBe('postgres');
    expect(summary.integrationsSandboxMode).toBe(true);
  });
});
