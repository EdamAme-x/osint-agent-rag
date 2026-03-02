import { ERROR_PREVIEW_MAX_CHARS, TWSTALKER_TIMEOUT_MS } from "../../config/constants.js";
import { fetchWithTimeout } from "../http/fetchWithTimeout.js";

function toProfileUrl(username: string): string {
  return `https://twstalker.com/${encodeURIComponent(username)}`;
}

export const twstalkerProfileGateway = {
  async fetchProfileMarkdown(input: { username: string }) {
    const profileUrl = toProfileUrl(input.username);
    const proxyUrl = `https://r.jina.ai/${profileUrl}`;
    const response = await fetchWithTimeout(proxyUrl, undefined, TWSTALKER_TIMEOUT_MS);
    const markdown = await response.text();
    if (!response.ok) {
      throw new Error(
        `Twstalker proxy HTTP ${response.status}: ${markdown.slice(0, ERROR_PREVIEW_MAX_CHARS)}`
      );
    }
    return {
      profileUrl,
      proxyUrl,
      markdown,
    };
  },
};
