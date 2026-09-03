/**
 * Provider implementation classes — not registered in production unless REAL_PROVIDER.
 */
export const PROVIDER_IMPLEMENTATION_CLASS = {
  TestOnly: 'TEST_ONLY',
  DevOnly: 'DEV_ONLY',
  Unconfigured: 'UNCONFIGURED',
  RealProvider: 'REAL_PROVIDER',
} as const;

export type ProviderImplementationClass =
  (typeof PROVIDER_IMPLEMENTATION_CLASS)[keyof typeof PROVIDER_IMPLEMENTATION_CLASS];

export const ACL_PROVIDER_CLASSIFICATION = {
  StubErpProvider: PROVIDER_IMPLEMENTATION_CLASS.TestOnly,
  StubTrackingProvider: PROVIDER_IMPLEMENTATION_CLASS.TestOnly,
  StubFiscalProvider: PROVIDER_IMPLEMENTATION_CLASS.TestOnly,
  StubNotificationProvider: PROVIDER_IMPLEMENTATION_CLASS.TestOnly,
  DygnusErpAdapter: PROVIDER_IMPLEMENTATION_CLASS.TestOnly,
  UnconfiguredErpProvider: PROVIDER_IMPLEMENTATION_CLASS.Unconfigured,
  UnconfiguredTrackingProvider: PROVIDER_IMPLEMENTATION_CLASS.Unconfigured,
  UnconfiguredFiscalProvider: PROVIDER_IMPLEMENTATION_CLASS.Unconfigured,
  UnconfiguredNotificationProvider: PROVIDER_IMPLEMENTATION_CLASS.Unconfigured,
} as const satisfies Record<string, ProviderImplementationClass>;
