import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../../domain/integration-error';

export type DygnusHttpResponse = {
  status: number;
  body: unknown;
};

export type DygnusHttpTransport = {
  get(
    path: string,
    options: { signal: AbortSignal; headers?: Record<string, string> },
  ): Promise<DygnusHttpResponse>;
};

export function mapDygnusHttpError(response: DygnusHttpResponse): IntegrationProviderError {
  const vendorDetail =
    typeof response.body === 'object' && response.body !== null
      ? JSON.stringify(response.body)
      : String(response.body);

  switch (response.status) {
    case 401:
      return new IntegrationProviderError(
        INTEGRATION_ERROR_CLASSES.Authentication,
        'DYGNUS_AUTHENTICATION_FAILED',
        { vendorDetail },
      );
    case 403:
      return new IntegrationProviderError(
        INTEGRATION_ERROR_CLASSES.Authorization,
        'DYGNUS_AUTHORIZATION_FAILED',
        { vendorDetail },
      );
    case 429:
      return new IntegrationProviderError(
        INTEGRATION_ERROR_CLASSES.RateLimit,
        'DYGNUS_RATE_LIMITED',
        { vendorDetail },
      );
    case 400:
    case 422:
      return new IntegrationProviderError(
        INTEGRATION_ERROR_CLASSES.InvalidPayload,
        'DYGNUS_INVALID_PAYLOAD',
        { vendorDetail },
      );
    case 404:
      return new IntegrationProviderError(
        INTEGRATION_ERROR_CLASSES.Permanent,
        'DYGNUS_RESOURCE_NOT_FOUND',
        { vendorDetail },
      );
    default:
      if (response.status >= 500) {
        return new IntegrationProviderError(
          INTEGRATION_ERROR_CLASSES.Transient,
          'DYGNUS_UPSTREAM_UNAVAILABLE',
          { vendorDetail },
        );
      }
      return new IntegrationProviderError(
        INTEGRATION_ERROR_CLASSES.Permanent,
        'DYGNUS_UNEXPECTED_RESPONSE',
        { vendorDetail },
      );
  }
}
