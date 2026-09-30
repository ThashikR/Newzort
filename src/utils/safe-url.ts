/**
 * Only allow normal web links. Feed content is data from the internet: even
 * though the news engine already filters links, the app refuses anything that
 * isn't http(s) — e.g. javascript:, intent:, file: or custom-scheme URLs —
 * in case the published feed is ever tampered with.
 *
 * A pattern check (not `new URL`) because React Native's URL implementation
 * has historically lacked some properties on device.
 */
const WEB_URL = /^https?:\/\/[a-z0-9.-]+(:\d+)?(\/[^\s]*)?$/i;

export function isSafeWebUrl(url: string | undefined | null): url is string {
  return typeof url === 'string' && url.length < 2048 && WEB_URL.test(url.trim());
}
