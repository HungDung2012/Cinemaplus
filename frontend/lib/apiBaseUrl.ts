export function resolveApiBaseUrl(rawValue = process.env.NEXT_PUBLIC_API_URL): string {
  const value = rawValue?.trim();

  if (!value) {
    return '/api';
  }

  const normalized = value.replace(/\/+$/, '');

  if (!normalized) {
    return '/api';
  }

  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}
