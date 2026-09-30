import Constants from 'expo-constants';

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

/**
 * Ask AI API — a Cloudflare Worker (worker/) that holds the AI keys as secrets.
 * Public URL; the keys never reach the app. Set EXPO_PUBLIC_ASK_API_URL=off to
 * use the on-device demo assistant instead.
 */
const DEFAULT_ASK_URL = 'https://newzort-ask.newzort-ask.workers.dev';

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_FEED_URL).trim().replace(/\/+$/, '');
const askRaw = (process.env.EXPO_PUBLIC_ASK_API_URL || DEFAULT_ASK_URL).trim().replace(/\/+$/, '');

export const env = {
  apiUrl,
  askApiUrl: askRaw === 'off' ? null : askRaw,
  /** Set EXPO_PUBLIC_USE_MOCK_DATA=true to use the built-in demo stories instead. */
  useMockData: (process.env.EXPO_PUBLIC_USE_MOCK_DATA ?? 'false').toLowerCase() === 'true',
  /** From app.json "version" — bump it whenever native code changes (see EAS Update notes in README). */
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
} as const;
