import { env } from '@/config/env';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/**
 * Minimal JSON client for the Vartify backend. The backend holds every
 * private key (LLM, news APIs, database); the app only ever talks to it.
 */
export async function apiFetch<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init?.timeoutMs ?? 15_000);
  try {
    const res = await fetch(`${env.apiUrl}${path}`, {
      ...init,
      signal: controller.signal,
      // Only send Content-Type with a body: on a plain GET it would force a CORS
      // preflight that static hosts (GitHub Pages) don't answer.
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
