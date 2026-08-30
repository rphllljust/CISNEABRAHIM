const MOCK_REQUEST_ORIGIN = 'http://test.cisne.local';

export function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

export function parseRequestPath(input: RequestInfo | URL): {
  url: string;
  pathname: string;
  searchParams: URLSearchParams;
} {
  const url = requestUrl(input);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    parsed = new URL(url, MOCK_REQUEST_ORIGIN);
  }
  return { url, pathname: parsed.pathname, searchParams: parsed.searchParams };
}
