import { DUCKDUCKGO_API_TIMEOUT_MS, ERROR_PREVIEW_MAX_CHARS } from "../../config/constants.js";
import { fetchWithTimeout } from "../http/fetchWithTimeout.js";
import type { DuckduckgoApiResponse } from "../../domain/duckduckgo/types.js";

export const duckduckgoSearchGateway = {
  async fetchSearchResponse(input: { query: string }): Promise<DuckduckgoApiResponse> {
    const params = new URLSearchParams({
      q: input.query,
      format: "json",
      no_html: "1",
      skip_disambig: "1",
    });
    const endpoint = `https://api.duckduckgo.com/?${params.toString()}`;
    const response = await fetchWithTimeout(endpoint, undefined, DUCKDUCKGO_API_TIMEOUT_MS);
    const body = await response.text();
    if (!response.ok) {
      throw new Error(
        `DuckDuckGo API HTTP ${response.status}: ${body.slice(0, ERROR_PREVIEW_MAX_CHARS)}`
      );
    }
    return JSON.parse(body) as DuckduckgoApiResponse;
  },
};
