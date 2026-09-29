const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function hoursSince(iso: string, now: number = Date.now()): number {
  return Math.max(0, (now - new Date(iso).getTime()) / HOUR);
}

/** "Just now", "12m ago", "3h ago", "Yesterday", "3 Sep". */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return 'Yesterday';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "Tuesday, September 29". */
export function longDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function isToday(iso: string, now: Date = new Date()): boolean {
  const d = new Date(iso);
  return d.toDateString() === now.toDateString();
}

/** Mock-data helper: an ISO timestamp `hours` before app start. */
export function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString();
}
