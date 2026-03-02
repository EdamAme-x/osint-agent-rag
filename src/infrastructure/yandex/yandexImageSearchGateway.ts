import { fetchWithTimeout } from "../http/fetchWithTimeout.js";
import { ERROR_PREVIEW_MAX_CHARS, YANDEX_IMAGE_TIMEOUT_MS } from "../../config/constants.js";

export const yandexImageSearchGateway = {
  async fetchSearchPage(input: { query: string; lr?: number }) {
    const params = new URLSearchParams({
      text: input.query,
    });
    if (typeof input.lr === "number") {
      params.set("lr", String(input.lr));
    }
    const searchUrl = `https://yandex.com/images/search?${params.toString()}`;
    const response = await fetchWithTimeout(searchUrl, undefined, YANDEX_IMAGE_TIMEOUT_MS);
    const html = await response.text();
    if (!response.ok) {
      throw new Error(
        `Yandex Images HTTP ${response.status}: ${html.slice(0, ERROR_PREVIEW_MAX_CHARS)}`
      );
    }
    return { searchUrl, html };
  },
};
