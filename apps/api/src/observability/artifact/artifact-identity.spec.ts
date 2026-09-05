import { describe, expect, it } from 'vitest';
import { buildArtifactIdentitySnapshot, KNOWN_ENVIRONMENTS } from './artifact-identity';

describe('artifact identity (sanitized exposure)', () => {
  const now = new Date('2026-09-04T12:00:00.000Z');

  it('exposes release/commit/build/environment only when they are safe', () => {
    const snapshot = buildArtifactIdentitySnapshot(
      {
        ARTIFACT_RELEASE: '0.1.0-hml',
        ARTIFACT_COMMIT: '3f0b7a5af9e355',
        ARTIFACT_BUILD: 'hml-20260904-3f0b7a5',
        CISNE_ENV: 'hml',
      },
      now,
    );
    expect(snapshot).toEqual({
      release: '0.1.0-hml',
      commitSha: '3f0b7a5af9e355',
      buildId: 'hml-20260904-3f0b7a5',
      environment: 'hml',
      collectedAt: now.toISOString(),
    });
  });

  it('never echoes malformed or sensitive environment values (fail-safe unknown)', () => {
    const snapshot = buildArtifactIdentitySnapshot(
      {
        ARTIFACT_RELEASE: '../../../etc/passwd',
        ARTIFACT_COMMIT: 'not-a-sha; DROP TABLE',
        ARTIFACT_BUILD: '${SECRET}',
        CISNE_ENV: 'production-prod-copy',
      },
      now,
    );
    expect(snapshot.release).toBe('unknown');
    expect(snapshot.commitSha).toBe('unknown');
    expect(snapshot.buildId).toBe('unknown');
    expect(snapshot.environment).toBe('unknown');
  });

  it('defaults to unknown when nothing is injected (no leakage)', () => {
    const snapshot = buildArtifactIdentitySnapshot({}, now);
    expect(snapshot).toEqual({
      release: 'unknown',
      commitSha: 'unknown',
      buildId: 'unknown',
      environment: 'unknown',
      collectedAt: now.toISOString(),
    });
  });

  it('accepts the known environment allowlist only', () => {
    expect(KNOWN_ENVIRONMENTS).toContain('hml');
    expect(KNOWN_ENVIRONMENTS).toContain('prod');
    expect(buildArtifactIdentitySnapshot({ CISNE_ENV: 'HML ' }, now).environment).toBe('hml');
    expect(buildArtifactIdentitySnapshot({ CISNE_ENV: 'prod' }, now).environment).toBe('prod');
  });
});
