import { DEFAULT_USER_AGENT, HTTP_DEFAULT_TIMEOUT_MS } from "../../config/constants.js";

export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = HTTP_DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}
