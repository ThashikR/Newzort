/**
 * Client environment configuration.
 *
 * Only EXPO_PUBLIC_* variables are available here, and they are PUBLIC:
 * they ship inside the app bundle. Private keys (LLM, news APIs, database)
 * must live on the backend — see `server/.env.example`.
 */

/**
 * The live news feed, rebuilt every 30 minutes by GitHub Actions
 * (.github/workflows/update-feed.yml) and hosted on GitHub Pages.
 * A public URL — safe to keep in code.
 */
const DEFAULT_FEED_URL = 'https://thashikr.github.io/Newzort';

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_FEED_URL).trim().replace(/\/+$/, '');

export const env = {
  apiUrl,
  /** Set EXPO_PUBLIC_USE_MOCK_DATA=true to use the built-in demo stories instead. */
  useMockData: (process.env.EXPO_PUBLIC_USE_MOCK_DATA ?? 'false').toLowerCase() === 'true',
  appVersion: '0.2.0',
} as const;
