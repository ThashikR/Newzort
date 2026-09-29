/**
 * Client environment configuration.
 *
 * Only EXPO_PUBLIC_* variables are available here, and they are PUBLIC:
 * they ship inside the app bundle. Private keys (LLM, news APIs, database)
 * must live on the backend — see `server/.env.example`.
 */

const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
const forceMock = (process.env.EXPO_PUBLIC_USE_MOCK_DATA ?? 'true').toLowerCase() === 'true';

export const env = {
  apiUrl,
  /** Demo data is used when forced, or when no backend URL is configured. */
  useMockData: forceMock || apiUrl.length === 0,
  appVersion: '0.1.0',
} as const;
