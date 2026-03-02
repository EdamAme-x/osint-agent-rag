import { fetchWithTimeout } from "../http/fetchWithTimeout.js";
import { ARCHIVE_TIMEOUT_MS, ERROR_PREVIEW_MAX_CHARS } from "../../config/constants.js";

export const archiveTodayGateway = {
  async fetchTimemap(url: string) {
    const endpoint = `https://archive.today/timemap/${url}`;
    const response = await fetchWithTimeout(endpoint, undefined, ARCHIVE_TIMEOUT_MS);
    const body = await response.text();
    if (!response.ok) {
      throw new Error(
        `archive.today timemap HTTP ${response.status}: ${body.slice(0, ERROR_PREVIEW_MAX_CHARS)}`
      );
    }
    return body;
  },
};
